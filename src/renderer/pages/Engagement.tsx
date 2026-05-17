import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Button, Table, Space, Modal, Form, Input, Select, DatePicker, Tag, Drawer, message } from 'antd';
import { PlusOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import { useEngagementStore } from '../stores/engagementStore';
import { useAppStore } from '../stores/appStore';
import { ENGAGEMENT_TYPES } from '../../shared/constants';
import type { Engagement } from '../../shared/types';
import dayjs from 'dayjs';

const Engagement = () => {
  const { t } = useTranslation();
  const { engagements, loadEngagements, createEngagement, updateEngagement, selectEngagement, selectedId } = useEngagementStore();
  const { setActiveEngagement } = useAppStore();
  const [formVisible, setFormVisible] = useState(false);
  const [editingEng, setEditingEng] = useState<Engagement | null>(null);
  const [scopeVisible, setScopeVisible] = useState(false);
  const [scopeText, setScopeText] = useState('');
  const [form] = Form.useForm();

  useEffect(() => { loadEngagements(); }, []);

  const handleCreate = () => {
    setEditingEng(null);
    form.resetFields();
    setFormVisible(true);
  };

  const handleEdit = (eng: Engagement) => {
    setEditingEng(eng);
    form.setFieldsValue({
      ...eng,
      date_range: eng.start_date ? [dayjs(eng.start_date), dayjs(eng.end_date)] : undefined,
    });
    setFormVisible(true);
  };

  const handleSave = () => {
    form.validateFields().then(values => {
      const data = {
        ...values,
        start_date: values.date_range?.[0]?.format('YYYY-MM-DD') || '',
        end_date: values.date_range?.[1]?.format('YYYY-MM-DD') || '',
      };
      delete (data as any).date_range;

      if (editingEng) {
        updateEngagement(editingEng.id, data);
        message.success('Engagement updated');
      } else {
        createEngagement(data);
        message.success('Engagement created');
      }
      setFormVisible(false);
    });
  };

  const handleScopeEdit = (eng: Engagement) => {
    selectEngagement(eng.id);
    setScopeText(eng.scope);
    setScopeVisible(true);
  };

  const handleScopeSave = () => {
    if (selectedId) {
      updateEngagement(selectedId, { scope: scopeText });
      message.success('Scope updated');
      setScopeVisible(false);
    }
  };

  const statusColors: Record<string, string> = { planning: 'orange', active: 'green', paused: 'default', completed: 'cyan', archived: 'default' };

  const columns = [
    { title: 'Client', dataIndex: 'client', key: 'client', render: (v: string, r: Engagement) => (
      <a onClick={() => { setActiveEngagement(r); }} style={{ color: '#00f0ff' }}>{v}</a>
    )},
    { title: 'Type', dataIndex: 'type', key: 'type', render: (v: string) => <Tag color="cyan">{v}</Tag> },
    { title: t('common.status'), dataIndex: 'status', key: 'status', render: (v: string) => <Tag color={statusColors[v]}>{t(`engagement.status.${v}`)}</Tag> },
    { title: t('engagement.scope'), dataIndex: 'scope', key: 'scope', ellipsis: true },
    { title: 'Period', key: 'period', render: (_: any, r: Engagement) => <span style={{ color: '#8888aa' }}>{r.start_date} ~ {r.end_date}</span> },
    { title: t('common.actions'), key: 'actions', render: (_: any, r: Engagement) => (
      <Space>
        <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(r)}>{t('common.edit')}</Button>
        <Button size="small" icon={<EyeOutlined />} onClick={() => handleScopeEdit(r)}>{t('engagement.scope')}</Button>
      </Space>
    )},
  ];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography.Title level={3} style={{ margin: 0 }} className="neon-title">{t('engagement.title')}</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>{t('engagement.create')}</Button>
      </div>

      <Table columns={columns} dataSource={engagements} rowKey="id" pagination={{ pageSize: 10 }} />

      {/* Create/Edit Modal */}
      <Modal
        title={editingEng ? t('engagement.edit') : t('engagement.create')}
        open={formVisible}
        onOk={handleSave}
        onCancel={() => setFormVisible(false)}
        width={640}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="client" label="Client" rules={[{ required: true }]}>
            <Input placeholder="Client name" />
          </Form.Item>
          <Form.Item name="type" label="Type" rules={[{ required: true }]}>
            <Select options={ENGAGEMENT_TYPES.map(et => ({ value: et.value, label: et.label }))} />
          </Form.Item>
          <Form.Item name="scope" label={t('engagement.scope')} rules={[{ required: true }]}>
            <Input.TextArea rows={4} placeholder="IPs, CIDRs, domains (comma or newline separated)" />
          </Form.Item>
          <Form.Item name="roe" label="Rules of Engagement">
            <Input.TextArea rows={3} placeholder="What is NOT allowed" />
          </Form.Item>
          <Form.Item name="date_range" label="Period">
            <DatePicker.RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="status" label={t('common.status')} initialValue="planning">
            <Select options={[
              { value: 'planning', label: t('engagement.status.planning') },
              { value: 'active', label: t('engagement.status.active') },
              { value: 'paused', label: t('engagement.status.paused') },
              { value: 'completed', label: t('engagement.status.completed') },
            ]} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Scope Editor Drawer */}
      <Drawer title={`${t('engagement.scope')} Editor`} open={scopeVisible} onClose={() => setScopeVisible(false)} width={500}
        extra={<Button type="primary" onClick={handleScopeSave}>{t('common.save')}</Button>}>
        <Typography.Paragraph type="secondary">
          Enter IPs, CIDR ranges, or domains (comma or newline separated)
        </Typography.Paragraph>
        <Input.TextArea
          value={scopeText}
          onChange={e => setScopeText(e.target.value)}
          rows={10}
          placeholder={"203.0.113.0/24\nexample.com\n10.0.0.1"}
        />
        <div style={{ marginTop: 16 }}>
          <Typography.Text strong style={{ color: '#00f0ff' }}>Parsed entries:</Typography.Text>
          <div style={{ marginTop: 8 }}>
            {scopeText.split(/[,\n]/).map(s => s.trim()).filter(Boolean).map((entry, i) => {
              const isCidr = /^\d+\.\d+\.\d+\.\d+\/\d+$/.test(entry);
              const isIp = /^\d+\.\d+\.\d+\.\d+$/.test(entry);
              const isDomain = /^[a-zA-Z0-9][a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(entry);
              const valid = isCidr || isIp || isDomain;
              return (
                <Tag key={i} color={valid ? 'green' : 'red'} style={{ marginBottom: 4 }}>
                  {isCidr ? 'CIDR' : isIp ? 'IP' : isDomain ? 'Domain' : '?'}: {entry}
                </Tag>
              );
            })}
          </div>
        </div>
      </Drawer>
    </div>
  );
};

export default Engagement;
