import { useState } from 'react';
import { Button, Input, Menu, message, Modal, Select, Tag } from 'antd';
import type { MenuProps } from 'antd';
import { DeleteOutlined, SettingOutlined } from '@ant-design/icons';
import { useAppStore } from '@/stores';
import { editProjectApi, deleteProjectApi } from '@/api/organization/index';
import { LOCALE_OPTIONS, getLocaleLabel } from '@/contants';
import { useNavigate, useParams } from 'react-router-dom';

type TabKey = 'general' | 'danger';

const menuItems: MenuProps['items'] = [
  { key: 'general', label: '通用', icon: <SettingOutlined /> },
  { key: 'danger', label: '危险操作', icon: <DeleteOutlined /> },
];

export function ProjectSettingPage() {
  const navigate = useNavigate();
  const { projectSlug, teamSlug } = useParams();
  const { currentProject, setCurrentProject, currentTeam, user: currentUser } = useAppStore();
  const isOwner = currentTeam?.ownerId === currentUser?.id;

  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [projectName, setProjectName] = useState(currentProject?.name || '');
  const [projectDesc, setProjectDesc] = useState(currentProject?.description || '');
  const [targetLanguages, setTargetLanguages] = useState<string[]>(currentProject?.targetLanguages || []);
  const [savingName, setSavingName] = useState(false);
  const [savingDesc, setSavingDesc] = useState(false);
  const [savingLangs, setSavingLangs] = useState(false);

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    setActiveTab(key as TabKey);
  };

  const handleSaveName = async () => {
    if (!projectName.trim()) {
      message.error('项目名称不能为空');
      return;
    }
    setSavingName(true);
    try {
      await editProjectApi({
        id: currentProject!.id,
        name: projectName,
        targetLanguages: currentProject!.targetLanguages,
      });
      setCurrentProject({ ...currentProject!, name: projectName });
      message.success('项目名称已更新');
    } catch {
      message.error('保存失败');
    } finally {
      setSavingName(false);
    }
  };

  const handleSaveDesc = async () => {
    setSavingDesc(true);
    try {
      await editProjectApi({
        id: currentProject!.id,
        name: currentProject!.name,
        targetLanguages: currentProject!.targetLanguages,
        description: projectDesc,
      });
      setCurrentProject({ ...currentProject!, description: projectDesc });
      message.success('项目描述已更新');
    } catch {
      message.error('保存失败');
    } finally {
      setSavingDesc(false);
    }
  };

  const handleSaveLangs = async () => {
    if (targetLanguages.length === 0) {
      message.error('至少需要一个目标语言');
      return;
    }
    setSavingLangs(true);
    try {
      await editProjectApi({
        id: currentProject!.id,
        name: currentProject!.name,
        targetLanguages,
      });
      setCurrentProject({ ...currentProject!, targetLanguages });
      message.success('目标语言已更新');
    } catch {
      message.error('保存失败');
    } finally {
      setSavingLangs(false);
    }
  };

  const handleDeleteProject = () => {
    Modal.confirm({
      title: '确认删除项目',
      content: '删除项目后，项目下所有的 Key 和对应的翻译都将被永久删除，此操作不可恢复。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteProjectApi(currentProject!.id);
          message.success('项目已删除');
          navigate(`/${currentTeam!.slug}`);
        } catch {
          message.error('删除失败');
        }
      },
    });
  };

  // 过滤掉源语言，不能作为目标语言
  const availableTargetOptions = LOCALE_OPTIONS.filter(
    (opt) => opt.value !== currentProject?.sourceLocale
  );

  return (
    <div className="flex gap-4">
      {/* Sidebar */}
      <div className="shrink-0 w-[200px]">
        <Menu
          items={menuItems}
          selectedKeys={[activeTab]}
          onClick={handleMenuClick}
          className="!border-none"
        />
      </div>

      {/* Content */}
      <div className="flex-1 space-y-5 pr-6 pb-6 pt-2">
        {activeTab === 'general' && (
          <>
            {/* Project Name Card */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-2">项目名称</h2>
                <p className="text-sm text-slate-500 mb-4">请输入项目的显示名称</p>
                <Input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  maxLength={32}
                  size="large"
                  placeholder="请输入项目名称"
                />
              </div>
              <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <span className="text-sm text-slate-400">最多 32 个字符</span>
                <Button type="primary" loading={savingName} onClick={handleSaveName}>
                  保存
                </Button>
              </div>
            </div>

            {/* Project Slug Card (Read-only) */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-2">项目标识</h2>
                <p className="text-sm text-slate-500 mb-4">项目的唯一标识，不可修改</p>
                <div className="flex">
                  <span className="inline-flex items-center px-3 border border-r-0 border-slate-300 rounded-l-md bg-slate-50 text-sm text-slate-500">
                    i18n.lancespace.club/{teamSlug}/
                  </span>
                  <Input
                    value={projectSlug || ''}
                    size="large"
                    className="!rounded-l-none flex-1"
                    disabled
                  />
                </div>
              </div>
              <div className="px-6 py-3 bg-slate-50 border-t border-slate-200">
                <span className="text-sm text-slate-400">项目标识在创建后不可更改</span>
              </div>
            </div>

            {/* Project Description Card */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-2">项目描述</h2>
                <p className="text-sm text-slate-500 mb-4">简要描述该项目的用途</p>
                <Input.TextArea
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  maxLength={200}
                  rows={3}
                  placeholder="请输入项目描述"
                />
              </div>
              <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <span className="text-sm text-slate-400">最多 200 个字符</span>
                <Button type="primary" loading={savingDesc} onClick={handleSaveDesc}>
                  保存
                </Button>
              </div>
            </div>

            {/* Source Locale Card (Read-only) */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-2">源语言</h2>
                <p className="text-sm text-slate-500 mb-4">项目的源语言，创建后不可修改</p>
                <Tag color="blue" className="text-sm px-3 py-1">
                  {getLocaleLabel(currentProject?.sourceLocale || '')} ({currentProject?.sourceLocale})
                </Tag>
              </div>
              <div className="px-6 py-3 bg-slate-50 border-t border-slate-200">
                <span className="text-sm text-slate-400">源语言在创建项目时确定，不可更改</span>
              </div>
            </div>

            {/* Target Languages Card */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-2">目标语言</h2>
                <p className="text-sm text-slate-500 mb-4">选择需要翻译的目标语言</p>
                <Select
                  mode="multiple"
                  value={targetLanguages}
                  onChange={setTargetLanguages}
                  options={availableTargetOptions}
                  size="large"
                  placeholder="请选择目标语言"
                  className="w-full"
                  optionFilterProp="label"
                />
              </div>
              <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <span className="text-sm text-slate-400">已选择 {targetLanguages.length} 种语言</span>
                <Button type="primary" loading={savingLangs} onClick={handleSaveLangs}>
                  保存
                </Button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'danger' && (
          <div className="border border-red-200 rounded-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-2">删除项目</h2>
              <p className="text-sm text-slate-500">
                永久删除该项目及其所有 Key 和翻译内容，此操作不可恢复
              </p>
            </div>
            <div className="px-6 py-3 bg-red-50/50 border-t border-red-200 flex justify-end">
              <Button
                danger
                type="primary"
                onClick={handleDeleteProject}
                disabled={!isOwner}
              >
                删除项目
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
