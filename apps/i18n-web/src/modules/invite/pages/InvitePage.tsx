import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button, message, Result, Spin } from 'antd';
import { TeamOutlined, LoginOutlined, HomeOutlined } from '@ant-design/icons';
import { validateInviteTokenApi, acceptInviteApi } from '@/api/organization';
import type { InviteValidateResult } from '@/api/organization/types';
import { getToken } from '@/services/request';
import { UserAvatar } from '@/components/UserAvatar';
import { CURRENT_TEAM_SLUG_LOCAL_STORAGE_KEY } from '@/contants';

type PageState = 'loading' | 'valid' | 'error';

const roleLabelMap: Record<string, string> = {
  ADMIN: 'Admin',
  EDITOR: 'Editor',
  READER: 'Reader',
};

export function InvitePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [state, setState] = useState<PageState>('loading');
  const [invite, setInvite] = useState<InviteValidateResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [accepting, setAccepting] = useState(false);

  const isLoggedIn = !!getToken();

  useEffect(() => {
    if (!token) {
      setState('error');
      setErrorMsg('缺少邀请 token');
      return;
    }

    validateInviteTokenApi(token)
      .then((res) => {
        setInvite(res.data);
        setState('valid');
      })
      .catch((err) => {
        setState('error');
        setErrorMsg(err.message || '邀请链接无效');
      });
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    setAccepting(true);
    try {
      const res = await acceptInviteApi(token);
      message.success('已成功加入团队');
      // 设置被邀请团队的 slug，让首页 loader 直接进入该团队
      localStorage.setItem(CURRENT_TEAM_SLUG_LOCAL_STORAGE_KEY, res.data.teamSlug);
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '加入团队失败';
      message.error(errorMessage);
    } finally {
      setAccepting(false);
    }
  };

  const handleLogin = () => {
    navigate(`/login?inviteToken=${token}`);
  };

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-100">
        <Spin size="large" tip="正在校验邀请链接..." />
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-100">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8 max-w-md w-full">
          <Result
            status="warning"
            title="邀请链接无效"
            subTitle={errorMsg}
            extra={
              <Button type="primary" icon={<HomeOutlined />} onClick={() => navigate('/', { replace: true })}>
                返回首页
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-100">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <TeamOutlined className="text-4xl text-blue-500 mb-3" />
          <h1 className="text-2xl font-bold text-slate-900">邀请你加入团队</h1>
        </div>

        <div className="bg-slate-50 rounded-lg p-5 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">团队</span>
            <span className="font-medium text-slate-900">{invite?.team.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">角色</span>
            <span className="font-medium text-slate-900">{roleLabelMap[invite?.role || ''] || invite?.role}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">邀请人</span>
            <div className="flex items-center gap-2">
              <UserAvatar avatar={invite?.inviter.avatar} name={invite?.inviter.name} />
              <span className="font-medium text-slate-900">{invite?.inviter.name}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">过期时间</span>
            <span className="text-sm text-slate-700">{invite?.expiresAt}</span>
          </div>
        </div>

        {isLoggedIn ? (
          <Button
            type="primary"
            size="large"
            block
            icon={<TeamOutlined />}
            loading={accepting}
            onClick={handleAccept}
          >
            加入团队
          </Button>
        ) : (
          <Button
            type="primary"
            size="large"
            block
            icon={<LoginOutlined />}
            onClick={handleLogin}
          >
            登录并加入团队
          </Button>
        )}
      </div>
    </div>
  );
}
