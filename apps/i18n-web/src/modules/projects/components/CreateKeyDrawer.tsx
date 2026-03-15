import { useEffect, useState } from 'react';
import { Button, Drawer, Form, Input, message } from 'antd';
import { TranslationOutlined } from '@ant-design/icons';
import { createKeyApi, editKeyApi, aiTranslateApi } from '@/api/translate/intex';
import type { ProjectInfo } from '@/api/organization/types';
import type { KeyInfo } from '@/api/translate/types';
import { getLocaleLabel } from '@/contants';

interface CreateKeyDrawerProps {
  open: boolean;
  project: ProjectInfo;
  editingKey?: KeyInfo | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormValues {
  key: string;
  description?: string;
  translations: Record<string, string>;
}

export function CreateKeyDrawer({ open, project, editingKey, onClose, onSuccess }: CreateKeyDrawerProps) {
  const [form] = Form.useForm<FormValues>();
  const [creating, setCreating] = useState(false);
  const [translating, setTranslating] = useState(false);
  const isEditing = !!editingKey;

  // 源语言 + 目标语言
  const allLocales = [project.sourceLocale, ...project.targetLanguages];

  useEffect(() => {
    if (open && editingKey) {
      const translations: Record<string, string> = {};
      editingKey.translations.forEach((t) => {
        translations[t.lang] = t.text;
      });
      form.setFieldsValue({
        key: editingKey.key,
        description: editingKey.description,
        translations,
      });
    }
  }, [open, editingKey, form]);

  const handleSubmit = async (values: FormValues) => {
    setCreating(true);
    try {
      if (isEditing) {
        await editKeyApi({
          id: editingKey.id,
          projectId: project.id,
          key: values.key,
          description: values.description,
          translations: values.translations || {},
        });
      } else {
        await createKeyApi({
          projectId: project.id,
          key: values.key,
          description: values.description,
          translations: values.translations || {},
        });
      }
      message.success(isEditing ? '更新成功' : '文案创建成功');
      form.resetFields();
      onSuccess();
    } catch {
      message.error(isEditing ? '更新失败' : '创建失败');
    } finally {
      setCreating(false);
    }
  };

  const handleAiTranslate = async () => {
    const values = form.getFieldsValue();
    const sourceText = values.translations?.[project.sourceLocale];
    if (!sourceText?.trim()) {
      message.warning('请先填写源语言文本');
      return;
    }
    setTranslating(true);
    try {
      const res = await aiTranslateApi({
        projectId: project.id,
        key: values.key || '',
        translations: values.translations || {},
      });
      form.setFieldsValue({ translations: res.data.translations });
      message.success('AI 翻译完成');
    } catch {
      message.error('AI 翻译失败');
    } finally {
      setTranslating(false);
    }
  };

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Drawer
      title={isEditing ? '编辑文案' : '创建文案'}
      open={open}
      onClose={handleClose}
      width={560}
      footer={
        <div className="flex items-center gap-2 justify-end h-10">
          <Button onClick={handleClose}>取消</Button>
          <Button type="primary" loading={creating} onClick={() => form.submit()}>
            {isEditing ? '保存' : '创建'}
          </Button>
        </div>
      }
      extra={
        <Button
          icon={<TranslationOutlined />}
          size='small'
          loading={translating}
          onClick={handleAiTranslate}
        >
          AI 一键翻译
        </Button>
      }
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          label="Key 名称"
          name="key"
          rules={[{ required: true, message: '请输入 Key 名称' }]}
        >
          <Input placeholder="请输入 Key 名称，例如：home.title" className="font-mono" />
        </Form.Item>

        <Form.Item label="描述" name="description">
          <Input placeholder="可选，描述该 Key 的用途或上下文" />
        </Form.Item>

        <div className="border-t border-slate-100 my-4" />

        {allLocales.map((locale) => {
          const isSource = locale === project.sourceLocale;
          const label = getLocaleLabel(locale);
          return (
            <Form.Item
              key={locale}
              label={
                <div className="flex items-center gap-2">
                  <div className="text-slate-700">
                    {label} <span className="text-slate-400">({locale})</span>
                    {isSource && <span className="ml-1 text-xs text-blue-500">源语言</span>}
                  </div>
                </div>
              }
              name={['translations', locale]}
              rules={isSource ? [{ required: true, message: `请输入${label}翻译` }] : undefined}
            >
              <Input.TextArea
                rows={2}
                placeholder={`${label} 翻译`}
              />
            </Form.Item>
          );
        })}
      </Form>
    </Drawer>
  );
}
