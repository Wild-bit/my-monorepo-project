import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Form, message } from 'antd';
import { PlusOutlined, TeamOutlined } from '@ant-design/icons';
import { useForm, Controller } from 'react-hook-form';
import { createTeamApi } from '@/api/organization';
import { CURRENT_TEAM_SLUG_LOCAL_STORAGE_KEY } from '@/contants';
import type { CreateTeamRequest } from '@/api/organization/types';

export function HomePage() {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const { handleSubmit, control } = useForm<CreateTeamRequest>({
    defaultValues: { name: '', description: '' },
  });

  const onSubmit = async (data: CreateTeamRequest) => {
    setCreating(true);
    try {
      const res = await createTeamApi({
        name: data.name,
        description: data.description,
      });
      localStorage.setItem(CURRENT_TEAM_SLUG_LOCAL_STORAGE_KEY, res.data.slug);
      message.success('团队创建成功');
      navigate(`/${res.data.slug}`, { replace: true });
    } catch {
      message.error('创建失败');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-md text-center">
        <div className="mb-6">
          <TeamOutlined className="text-5xl text-slate-300" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">还没有团队</h1>
        <p className="text-slate-500 mb-8">创建一个团队开始协作吧</p>
        <div className="bg-white border border-slate-200 rounded-lg p-6 text-left">
          <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
            <Form.Item label="团队名称" required>
              <Controller
                name="name"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Input {...field} placeholder="请输入团队名称" maxLength={12} />
                )}
              />
            </Form.Item>
            <Form.Item label="团队描述">
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <Input.TextArea {...field} placeholder="简单描述一下你的团队（可选）" rows={3} />
                )}
              />
            </Form.Item>
            <Button type="primary" htmlType="submit" icon={<PlusOutlined />} loading={creating} block>
              创建团队
            </Button>
          </Form>
        </div>
      </div>
    </div>
  );
}
