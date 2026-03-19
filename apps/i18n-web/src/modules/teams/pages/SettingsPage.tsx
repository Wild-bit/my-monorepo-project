import { useEffect, useState } from 'react';
import { Button, Dropdown, Input, Menu, message, Modal, Skeleton, Space, Table, Tag } from 'antd';
import type { MenuProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CopyOutlined, DeleteOutlined, EditOutlined, LinkOutlined, SettingOutlined, StopOutlined, TeamOutlined } from '@ant-design/icons';
import { useAppStore } from '@/stores';
import {
  editTeamInfoApi,
  getTeamMembersApi,
  updateMemberRoleApi,
  removeMemberApi,
  createInviteLinkApi,
  getInviteLinksApi,
  revokeInviteLinkApi,
} from '@/api/organization/index';
import type { TeamMemberInfo, InviteLinkInfo } from '@/api/organization/types';
import { UserAvatar } from '@/components/UserAvatar';

type TabKey = 'general' | 'members' | 'invites';

const menuItems: MenuProps['items'] = [
  { key: 'general', label: '通用', icon: <SettingOutlined /> },
  { key: 'members', label: '团队成员', icon: <TeamOutlined /> },
  { key: 'invites', label: '邀请链接', icon: <LinkOutlined /> },
];

export function SettingsPage() {
  const { currentTeam, updateCurrentTeam, user: currentUser, canAdmin } = useAppStore();
  const isOwner = currentTeam?.ownerId === currentUser?.id;
  const currentMemberRole = () => {
    const me = members.find((m) => m.user.id === currentUser?.id);
    return me?.role;
  };

  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [teamName, setTeamName] = useState(currentTeam?.name || '');
  const [teamUrlSlug, setTeamUrlSlug] = useState(currentTeam?.slug || '');
  const [savingName, setSavingName] = useState(false);
  const [savingSlug, setSavingSlug] = useState(false);
  const [members, setMembers] = useState<TeamMemberInfo[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [inviteLinks, setInviteLinks] = useState<InviteLinkInfo[]>([]);
  const [inviteTotal, setInviteTotal] = useState(0);
  const [invitePage, setInvitePage] = useState(1);
  const [invitePageSize, setInvitePageSize] = useState(10);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [creatingInvite, setCreatingInvite] = useState(false);

  const fetchMembers = () => {
    if (!currentTeam?.id) return;
    setLoadingMembers(true);
    getTeamMembersApi(currentTeam.id)
      .then((res) => setMembers(res.data))
      .catch(() => message.error('获取成员列表失败'))
      .finally(() => setLoadingMembers(false));
  };

  const fetchInviteLinks = (page = invitePage, pageSize = invitePageSize) => {
    if (!currentTeam?.id) return;
    setLoadingInvites(true);
    getInviteLinksApi({ teamId: currentTeam.id, page, pageSize })
      .then((res) => {
        setInviteLinks(res.data.items);
        setInviteTotal(res.data.total);
      })
      .catch(() => message.error('获取邀请链接失败'))
      .finally(() => setLoadingInvites(false));
  };

  const handleCreateInvite = async () => {
    if (!currentTeam?.id || !currentUser?.id) return;
    setCreatingInvite(true);
    try {
      const res = await createInviteLinkApi({
        teamId: currentTeam.id,
      });
      const url = `${window.location.origin}/invite?token=${res.data.token}`;
      await navigator.clipboard.writeText(url);
      message.success('邀请链接已生成并复制到剪贴板');
      setInvitePage(1);
      fetchInviteLinks(1, invitePageSize);
    } catch {
      message.error('生成邀请链接失败');
    } finally {
      setCreatingInvite(false);
    }
  };

  const handleRevokeInvite = (invite: InviteLinkInfo) => {
    Modal.confirm({
      title: '确认撤销邀请',
      content: '撤销后该链接将无法使用',
      okText: '撤销',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await revokeInviteLinkApi(invite.id);
          message.success('邀请已撤销');
          fetchInviteLinks();
        } catch {
          message.error('撤销失败');
        }
      },
    });
  };

  const handleCopyLink = async (token: string) => {
    const url = `${window.location.origin}/invite?token=${token}`;
    await navigator.clipboard.writeText(url);
    message.success('链接已复制');
  };

  const handleChangeRole = async (memberId: string, role: string) => {
    try {
      await updateMemberRoleApi(memberId, role);
      message.success('角色已更新');
      fetchMembers();
    } catch {
      message.error('修改角色失败');
    }
  };

  const handleRemoveMember = (member: TeamMemberInfo) => {
    Modal.confirm({
      title: '确认移除成员',
      content: `确定要将 ${member.user.name} 从团队中移除吗？`,
      okText: '移除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await removeMemberApi(member.id);
          message.success('成员已移除');
          fetchMembers();
        } catch {
          message.error('移除失败');
        }
      },
    });
  };

  // 判断当前用户能否操作目标成员
  const canOperate = (target: TeamMemberInfo) => {
    if (target.user.id === currentUser?.id) return false; // 不能操作自己
    if (target.user.id === currentTeam?.ownerId) return false; // 不能操作 Owner
    if (isOwner) return true; // Owner 可以操作所有人
    if (currentMemberRole() === 'ADMIN' && target.role !== 'ADMIN') return true; // Admin 可以操作非 Admin
    return false;
  };

  useEffect(() => {
    if (activeTab === 'members') {
      fetchMembers();
    }
    if (activeTab === 'invites') {
      fetchInviteLinks();
    }
  }, [activeTab, currentTeam?.id]);

  const roleColorMap: Record<string, string> = {
    ADMIN: 'red',
    EDITOR: 'blue',
    READER: 'default',
  };

  const roleLabelMap: Record<string, string> = {
    ADMIN: 'Admin',
    EDITOR: 'Editor',
    READER: 'Reader',
  };

  const inviteStatusMap: Record<string, { label: string; color: string }> = {
    ACTIVE: { label: '有效', color: 'green' },
    USED: { label: '已使用', color: 'default' },
    EXPIRED: { label: '已过期', color: 'default' },
    REVOKED: { label: '已撤销', color: 'red' },
  };

  const inviteColumns: ColumnsType<InviteLinkInfo> = [
    {
      title: '邀请人',
      render: (_: unknown, record: InviteLinkInfo) => (
        <div className="flex flex-col items-center gap-1">
          <UserAvatar avatar={record.inviter.avatar} name={record.inviter.name} />
          <span className="text-xs text-slate-500">{record.inviter.name}</span>
        </div>
      ),
    },
    {
      title: '被邀请角色',
      dataIndex: 'role',
      render: (role: string) => (
        <Tag color={roleColorMap[role] || 'default'}>{roleLabelMap[role] || role}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (status: string) => {
        const info = inviteStatusMap[status] || { label: status, color: 'default' };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: '过期时间',
      dataIndex: 'expiresAt',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
    },
    {
      title: '操作',
      render: (_: unknown, record: InviteLinkInfo) => (
        <Space>
          {record.status === 'ACTIVE' && (
            <>
              <Button size="small" icon={<CopyOutlined />} onClick={() => handleCopyLink(record.token)}>
                复制链接
              </Button>
              {canAdmin() && (
                <Button size="small" danger icon={<StopOutlined />} onClick={() => handleRevokeInvite(record)}>
                  撤销
                </Button>
              )}
            </>
          )}
        </Space>
      ),
    },
  ];

  const memberColumns: ColumnsType<TeamMemberInfo> = [
    {
      title: '头像',
      dataIndex: ['user', 'avatar'],
      width: 60,
      render: (value: string, recode: TeamMemberInfo) => {
        return <UserAvatar avatar={value} name={recode.user.name} />
      }
    },
    {
      title: '成员',
      dataIndex: ['user', 'name'],
    },
    {
      title: '邮箱',
      dataIndex: ['user', 'email'],
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string, record: TeamMemberInfo) => {
        const isRecordOwner = record.user.id === currentTeam?.ownerId;
        if (isRecordOwner) {
          return <Tag color="gold">Owner</Tag>;
        }
        return <Tag color={roleColorMap[role] || 'default'}>{roleLabelMap[role] || role}</Tag>;
      },
    },
    {
      title: '注册时间',
      dataIndex: 'joinedAt'
    },
    {
      title: '最后登录时间',
      dataIndex: ['user', 'lastLoginAt']
    },
    {
      title: '操作',
      render: (_: unknown, record: TeamMemberInfo) => {
        const disabled = !canOperate(record);

        const roleOptions = [
          { key: 'ADMIN', label: 'Admin' },
          { key: 'EDITOR', label: 'Editor' },
          { key: 'READER', label: 'Reader' },
        ].filter((item) => {
          if (item.key === record.role) return false;
          if (item.key === 'ADMIN' && !isOwner) return false;
          return true;
        });

        return (
          <Space>
            <Dropdown
              disabled={disabled}
              menu={{
                items: roleOptions,
                onClick: ({ key }) => handleChangeRole(record.id, key),
              }}
            >
              <Button size="small" icon={<EditOutlined />} disabled={disabled}>修改角色</Button>
            </Dropdown>
            <Button size="small" danger icon={<DeleteOutlined />} disabled={disabled} onClick={() => handleRemoveMember(record)}>
              移除
            </Button>
          </Space>
        );
      },
    }
  ];

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    setActiveTab(key as TabKey);
  };

  const handleSaveName = async () => {
    if (!teamName.trim()) {
      message.error('团队名称不能为空');
      return;
    }
    setSavingName(true);
    try {
      await editTeamInfoApi({
        id: currentTeam!.id,
        name: teamName,
      });
      updateCurrentTeam({ name: teamName });
      message.success('团队名称已更新');
    } catch {
      message.error('保存失败');
    } finally {
      setSavingName(false);
    }
  };

  const handleSaveSlug = async () => {
    if (!teamUrlSlug.trim()) {
      message.error('团队 URL 不能为空');
      return;
    }
    setSavingSlug(true);
    try {
      await editTeamInfoApi({
        id: currentTeam!.id,
        slug: teamUrlSlug,
      });
      updateCurrentTeam({ slug: teamUrlSlug });
      message.success('团队 URL 已更新');
    } catch {
      message.error('保存失败');
    } finally {
      setSavingSlug(false);
    }
  };

  const handleDeleteTeam = () => {
    Modal.confirm({
      title: '确认删除团队',
      content: '永久删除该团队和该团队下所有内容，此操作不可恢复。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          // TODO: call delete team API
          message.success('团队已删除');
        } catch {
          message.error('删除失败');
        }
      },
    });
  };

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
            {/* Team Name Card */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-2">团队名称</h2>
                <p className="text-sm text-slate-500 mb-4">请输入一个显示用的团队名称</p>
                <Input
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  maxLength={12}
                  size="large"
                  placeholder="请输入团队名称"
                />
              </div>
              <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <span className="text-sm text-slate-400">最多 12 个字符</span>
                <Button type="primary" loading={savingName} onClick={handleSaveName} disabled={!canAdmin()}>
                  保存
                </Button>
              </div>
            </div>

            {/* Team URL Card */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-2">团队 URL</h2>
                <p className="text-sm text-slate-500 mb-4">这也是你在云词的唯一团队空间名</p>
                <div className="flex">
                  <span className="inline-flex items-center px-3 border border-r-0 border-slate-300 rounded-l-md bg-slate-50 text-sm text-slate-500">
                    i18n.lancespace.club/
                  </span>
                  <Input
                    value={teamUrlSlug}
                    onChange={(e) => setTeamUrlSlug(e.target.value)}
                    maxLength={24}
                    size="large"
                    className="!rounded-l-none"
                    placeholder="请输入团队标识"
                  />
                </div>
              </div>
              <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <span className="text-sm text-slate-400">
                  团队标识，最多 24 个字符，只能是大小写字母、数字、下划线和横线
                </span>
                <Button type="primary" loading={savingSlug} onClick={handleSaveSlug} disabled={!canAdmin()}>
                  保存
                </Button>
              </div>
            </div>

            {/* Delete Team Card */}
            <div className="border border-red-200 rounded-lg overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-2">删除团队</h2>
                <p className="text-sm text-slate-500">
                  永久删除该团队和该团队下所有内容，不可恢复
                </p>
              </div>
              <div className="px-6 py-3 bg-red-50/50 border-t border-red-200 flex justify-end">
                <Button danger type="primary" onClick={handleDeleteTeam} disabled={!canAdmin()}>
                  删除
                </Button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'members' && (
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-2">团队成员</h2>
              <p className="text-sm text-slate-500 mb-4">管理团队成员及其权限</p>
              {loadingMembers ? (
                <Skeleton active paragraph={{ rows: 3 }} />
              ) : (
                <Table
                  columns={memberColumns}
                  dataSource={members}
                  rowKey="id"
                  pagination={false}
                  size="middle"
                />
              )}
            </div>
          </div>
        )}

        {activeTab === 'invites' && (
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-1">邀请链接</h2>
                  <p className="text-sm text-slate-500">生成邀请链接，发送给被邀请者加入团队</p>
                </div>
                {canAdmin() && (
                  <Button type="primary" loading={creatingInvite} onClick={handleCreateInvite}>
                    生成邀请链接
                  </Button>
                )}
              </div>
              {loadingInvites ? (
                <Skeleton active paragraph={{ rows: 2 }} />
              ) : (
                <Table
                  columns={inviteColumns}
                  dataSource={inviteLinks}
                  rowKey="id"
                  size="middle"
                  locale={{ emptyText: '暂无邀请链接' }}
                  pagination={{
                    current: invitePage,
                    pageSize: invitePageSize,
                    total: inviteTotal,
                    showTotal: (total) => `共 ${total} 条`,
                    showSizeChanger: true,
                    onChange: (page, pageSize) => {
                      setInvitePage(page);
                      setInvitePageSize(pageSize);
                      fetchInviteLinks(page, pageSize);
                    },
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
