import { useState } from 'react';
import { useRouteLoaderData } from 'react-router-dom';
import { Button, Input, message, Modal, Pagination, Popover, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, MoreOutlined } from '@ant-design/icons';
import { deleteKeyApi } from '@/api/translate/intex';
import { usePaginatedFetch } from '@/hooks/useFetch';
import type { KeyInfo, KeyListQuery, KeyListResponse, TranslationItem } from '@/api/translate/types';
import type { ProjectInfo } from '@/api/organization/types';
import { Empty } from '@/components/Empty';
import { CreateKeyDrawer } from '../components/CreateKeyDrawer';
import { getLocaleLabel } from '@/contants';
import { useAppStore } from '@/stores';

function ActionPopover({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      trigger="hover"
      placement="bottom"
      content={
        <div className="flex flex-col gap-1 -m-1">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => { setOpen(false); onEdit(); }}
            className="justify-start"
          >
            编辑
          </Button>
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => { setOpen(false); onDelete(); }}
            className="justify-start"
          >
            删除
          </Button>
        </div>
      }
    >
      <Button type="text" size="small" icon={<MoreOutlined className="rotate-90" />} />
    </Popover>
  );
}

export function KeysPage() {
  const { project } = useRouteLoaderData('project-detail') as { project: ProjectInfo };
  const canEdit = useAppStore((s) => s.canEdit);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<KeyInfo | null>(null);

  const { data, isLoading, mutate } = usePaginatedFetch<KeyListResponse, KeyListQuery>(
    '/keys/list',
    { projectId: project.id, page, pageSize, search: search || undefined },
  );


  const keys = data?.items ?? [];
  const total = data?.total ?? 0;

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleDelete = (record: KeyInfo) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除 Key「${record.key}」吗？删除后无法恢复。`,
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteKeyApi(record.id);
          message.success('删除成功');
          mutate();
        } catch {
          message.error('删除失败');
        }
      },
    });
  };

  const allLanguages = [project.sourceLocale, ...project.targetLanguages];

  const columns: ColumnsType<KeyInfo> = [
    {
      title: 'Key',
      dataIndex: 'key',
      ellipsis: true,
      fixed: 'left',
      render: (text: string) => <span className="font-mono text-sm">{text}</span>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      ellipsis: true,
      render: (text: string) => <span className="text-slate-500">{text || '-'}</span>,
    },
    ...allLanguages.map<ColumnsType<KeyInfo>[number]>((lang) => ({
      title: () => (
        <span>
          {getLocaleLabel(lang)}
          {lang === project.sourceLocale && <span className="ml-1 text-xs text-blue-500">源</span>}
        </span>
      ),
      dataIndex: 'translations',
      ellipsis: true,
      render: (translations: TranslationItem[]) => {
        const t = translations.find((item) => item.lang === lang);
        return <span className={t?.text ? 'text-slate-700' : 'text-slate-400'}>{t?.text || '-'}</span>;
      },
    })),
    ...(canEdit() ? [{
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      width: 80,
      render: (_: any, record: KeyInfo) => (
        <ActionPopover
          onEdit={() => {
            setEditingKey(record);
            setDrawerOpen(true);
          }}
          onDelete={() => handleDelete(record)}
        />
      ),
    }] : []),
  ];

  const hasData = total > 0 || search;

  const createButton = canEdit() ? (
    <Button type="primary" icon={<PlusOutlined />} onClick={() => setDrawerOpen(true)}>
      创建文案
    </Button>
  ) : null;

  return (
    <div className="p-6 flex-1 flex flex-col">
      {hasData ? (
        <>
          <div className="flex items-center justify-between mb-4">
            <Input.Search
              placeholder="搜索 Key"
              prefix={<SearchOutlined className="text-slate-400" />}
              allowClear
              onSearch={handleSearch}
              className="w-64"
            />
            {createButton}
          </div>
          <div className="flex-1 overflow-hidden">
            <Table
              columns={columns}
              dataSource={keys}
              rowKey="id"
              loading={isLoading}
              size="middle"
              scroll={{ x: '1600px' }}
              pagination={false}
              locale={{
                emptyText: <Empty title="未找到匹配的 Key" description="尝试更换搜索关键词" variant="v2" />,
              }}
            />
          </div>
          <div className="flex justify-end pt-4">
            <Pagination
              current={page}
              pageSize={pageSize}
              total={total}
              showTotal={(t) => `共 ${t} 条`}
              showSizeChanger
              onChange={(p, ps) => {
                setPage(p);
                setPageSize(ps);
              }}
            />
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <Empty
            title="还没有翻译词条"
            description="创建你的第一个国际化 Key，开始管理多语言翻译"
            action={createButton}
            variant="v2"
          />
        </div>
      )}

      <CreateKeyDrawer
        open={drawerOpen}
        project={project}
        editingKey={editingKey}
        onClose={() => {
          setDrawerOpen(false);
          setEditingKey(null);
        }}
        onSuccess={() => {
          setDrawerOpen(false);
          setEditingKey(null);
          mutate();
        }}
      />
    </div>
  );
}
