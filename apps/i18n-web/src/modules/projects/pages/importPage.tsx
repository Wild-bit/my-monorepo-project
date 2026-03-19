import { useState, useMemo } from 'react';
import { Button, Radio, Upload, Tag, message } from 'antd';
import {
  FileTextOutlined,
  CheckCircleFilled,
  DeleteOutlined,
  InboxOutlined,
  ImportOutlined,
} from '@ant-design/icons';
import { useAppStore } from '@/stores';
import { getLocaleLabel } from '@/contants';
import { importJsonApi, type ImportFileData } from '@/api/import';

type FileFormat = 'json';
type ConflictStrategy = 'skip' | 'overwrite';

interface ParsedFile {
  fileName: string;
  lang: string;
  keyCount: number;
  translations: Record<string, any>;
}

const FORMAT_OPTIONS = [
  {
    value: 'json' as FileFormat,
    label: 'JSON',
    description: '标准 JSON 格式，适用于大多数前端框架',
    icon: '{ }',
  },
];

/** 从文件名中检测语言代码，如 zh-CN.json → zh-CN */
function detectLangFromFileName(fileName: string): string {
  return fileName.replace(/\.json$/i, '');
}

/** 统计 JSON 对象中叶子节点数量 */
function countKeys(obj: Record<string, any>): number {
  let count = 0;
  for (const value of Object.values(obj)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      count += countKeys(value);
    } else {
      count++;
    }
  }
  return count;
}

export function ImportPage() {
  const { currentProject, canEdit } = useAppStore();

  const [selectedFormat, setSelectedFormat] = useState<FileFormat>('json');
  const [strategy, setStrategy] = useState<ConflictStrategy>('skip');
  const [parsedFiles, setParsedFiles] = useState<ParsedFile[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ created: number; updated: number; skipped: number } | null>(null);

  const allLanguages = useMemo(() => {
    const source = currentProject?.sourceLocale;
    const targets = currentProject?.targetLanguages || [];
    if (!source) return [];
    return [source, ...targets];
  }, [currentProject]);

  const handleFileRead = (file: File) => {
    file.text().then((text) => {
      try {
        const content = JSON.parse(text);
        const lang = detectLangFromFileName(file.name);
        if (!allLanguages.includes(lang)) {
          message.warning(`文件 "${file.name}" 检测到语言 "${lang}"，不在项目语言列表中`);
          return;
        }
        if (parsedFiles.some((f) => f.lang === lang)) {
          message.warning(`语言 "${lang}" 已存在，请先删除后重新上传`);
          return;
        }
        setParsedFiles((prev) => [
          ...prev,
          { fileName: file.name, lang, keyCount: countKeys(content), translations: content },
        ]);
      } catch {
        message.error(`文件 "${file.name}" 解析失败，请确认为有效 JSON`);
      }
    });
    return false;
  };

  const handleRemoveFile = (lang: string) => {
    setParsedFiles((prev) => prev.filter((f) => f.lang !== lang));
  };

  const handleImport = async () => {
    if (parsedFiles.length === 0) {
      message.warning('请先上传文件');
      return;
    }
    setImporting(true);
    setResult(null);
    try {
      const files: ImportFileData[] = parsedFiles.map((f) => ({
        lang: f.lang,
        translations: f.translations,
      }));
      const res = await importJsonApi({
        projectId: currentProject!.id,
        strategy,
        files,
      });
      setResult(res.data);
      message.success('导入成功');
    } catch {
      message.error('导入失败，请稍后重试');
    } finally {
      setImporting(false);
    }
  };

  const totalKeys = parsedFiles.reduce((sum, f) => sum + f.keyCount, 0);

  return (
    <div className="px-6 py-4 space-y-5">
      {/* 文件格式 */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-2">文件格式</h2>
          <p className="text-sm text-slate-500 mb-4">选择导入的文件格式</p>
          <Radio.Group value={selectedFormat} onChange={(e) => setSelectedFormat(e.target.value)} className="w-full">
            <div className="grid grid-cols-1 gap-3">
              {FORMAT_OPTIONS.map((fmt) => (
                <label
                  key={fmt.value}
                  className={`relative flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedFormat === fmt.value ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Radio value={fmt.value} className="!hidden" />
                  <div className="shrink-0 w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center">
                    <span className="text-sm font-mono font-bold text-slate-600">{fmt.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-base">{fmt.label}</span>
                      {selectedFormat === fmt.value && (
                        <CheckCircleFilled className="text-blue-500 text-sm absolute right-8 top-1/2 -translate-y-1/2" />
                      )}
                    </div>
                    <p className="text-sm text-slate-500 m-0">{fmt.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </Radio.Group>
        </div>
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200">
          <span className="text-sm text-slate-400">
            <FileTextOutlined className="mr-1" />
            导入 <span className="font-medium text-slate-600">.{selectedFormat}</span> 文件
          </span>
        </div>
      </div>

      {/* 文件上传 */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-2">上传文件</h2>
          <p className="text-sm text-slate-500 mb-4">
            上传 JSON 翻译文件，文件名需为语言代码（如 <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">zh-CN.json</code>）
          </p>
          <Upload.Dragger
            accept=".json"
            multiple
            showUploadList={false}
            beforeUpload={handleFileRead}
          >
            <p className="ant-upload-drag-icon"><InboxOutlined /></p>
            <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
            <p className="ant-upload-hint">支持同时上传多个 .json 文件</p>
          </Upload.Dragger>
        </div>
      </div>

      {/* 已上传文件列表 */}
      {parsedFiles.length > 0 && (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-2">已解析文件</h2>
            <div className="space-y-2">
              {parsedFiles.map((f) => (
                <div key={f.lang} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <FileTextOutlined className="text-blue-500" />
                    <span className="text-sm font-medium text-slate-700">{f.fileName}</span>
                    <Tag color="blue">{getLocaleLabel(f.lang)} ({f.lang})</Tag>
                    <span className="text-xs text-slate-400">{f.keyCount} 个 Key</span>
                  </div>
                  <Button type="text" danger icon={<DeleteOutlined />} size="small" onClick={() => handleRemoveFile(f.lang)} />
                </div>
              ))}
            </div>
          </div>
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-200">
            <span className="text-sm text-slate-400">
              共 {parsedFiles.length} 个文件，{totalKeys} 个 Key
            </span>
          </div>
        </div>
      )}

      {/* 冲突策略 */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-2">冲突策略</h2>
          <p className="text-sm text-slate-500 mb-4">当导入的 Key 已存在时，选择处理方式</p>
          <Radio.Group value={strategy} onChange={(e) => setStrategy(e.target.value)} className="w-full">
            <div className="grid grid-cols-1 gap-3">
              <label className={`relative flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                strategy === 'skip' ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 hover:border-slate-300'
              }`}>
                <Radio value="skip" className="!hidden" />
                <div className="flex-1 min-w-0 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 text-base">跳过</span>
                    {strategy === 'skip' && <CheckCircleFilled className="text-blue-500 text-sm absolute right-8 top-1/2 -translate-y-1/2" />}
                  </div>
                  <p className="text-sm text-slate-500 m-0">保留已有翻译，仅导入新 Key</p>
                </div>
              </label>
              <label className={`relative flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                strategy === 'overwrite' ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 hover:border-slate-300'
              }`}>
                <Radio value="overwrite" className="!hidden" />
                <div className="flex-1 min-w-0 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 text-base">覆盖</span>
                    {strategy === 'overwrite' && <CheckCircleFilled className="text-blue-500 text-sm absolute right-8 top-1/2 -translate-y-1/2" />}
                  </div>
                  <p className="text-sm text-slate-500 m-0">用导入内容覆盖已有翻译</p>
                </div>
              </label>
            </div>
          </Radio.Group>
        </div>
      </div>

      {/* 导入操作 */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-2">导入翻译</h2>
          <p className="text-sm text-slate-500 mb-1">
            将 <span className="font-medium text-slate-700">{parsedFiles.length}</span> 个文件的翻译内容导入项目
          </p>
          <p className="text-sm text-slate-400">
            冲突策略：{strategy === 'skip' ? '跳过已有 Key' : '覆盖已有翻译'}
          </p>
          {result && (
            <div className="mt-3 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700">
              导入完成：新增 {result.created} 个 Key，更新 {result.updated} 个，跳过 {result.skipped} 个
            </div>
          )}
        </div>
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-sm text-slate-400">
            共 {totalKeys} 个 Key
          </span>
          <Button
            type="primary"
            icon={<ImportOutlined />}
            loading={importing}
            disabled={parsedFiles.length === 0 || !canEdit()}
            onClick={handleImport}
            size="large"
          >
            导入文件
          </Button>
        </div>
      </div>

    </div>
  );
}
