import React, { useState, useEffect } from 'react';
import { Card, Tabs, Button, Table, Tag, Statistic, Row, Col, DatePicker, Select } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MailOutlined, ShoppingOutlined, UserOutlined, DollarOutlined } from '@ant-design/icons';
import { whiteLabelService } from '@/services/white-label';

const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

interface ClientMetrics {
  totalCampaigns: number;
  totalEmails: number;
  averageOpenRate: number;
  averageClickRate: number;
  totalConversions: number;
}

interface Campaign {
  id: string;
  name: string;
  sentAt: Date;
  status: string;
  sentCount: number;
  openRate: number;
  clickRate: number;
  conversions: number;
  revenue: number;
}

export const ClientDashboard: React.FC<{ clientId: string }> = ({ clientId }) => {
  const [metrics, setMetrics] = useState<ClientMetrics | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<[Date, Date]>([
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    new Date()
  ]);

  useEffect(() => {
    loadClientData();
  }, [clientId, dateRange]);

  const loadClientData = async () => {
    try {
      const report = await whiteLabelService.generateClientReport(clientId);
      if (report) {
        setMetrics(report.metrics);
        setCampaigns(report.campaigns);
      }
    } catch (error) {
      console.error('Error loading client data:', error);
    } finally {
      setLoading(false);
    }
  };

  const campaignColumns = [
    {
      title: 'Campaign Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Sent',
      dataIndex: 'sentAt',
      key: 'sentAt',
      render: (date: Date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={
          status === 'completed' ? 'green' :
          status === 'running' ? 'blue' :
          status === 'scheduled' ? 'orange' :
          'red'
        }>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Sent',
      dataIndex: 'sentCount',
      key: 'sentCount',
      render: (count: number) => count.toLocaleString(),
    },
    {
      title: 'Open Rate',
      dataIndex: 'openRate',
      key: 'openRate',
      render: (rate: number) => `${(rate * 100).toFixed(1)}%`,
    },
    {
      title: 'Click Rate',
      dataIndex: 'clickRate',
      key: 'clickRate',
      render: (rate: number) => `${(rate * 100).toFixed(1)}%`,
    },
    {
      title: 'Conversions',
      dataIndex: 'conversions',
      key: 'conversions',
      render: (count: number) => count.toLocaleString(),
    },
    {
      title: 'Revenue',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (amount: number) => `$${amount.toLocaleString()}`,
    },
  ];

  const getChartData = () => {
    return campaigns.map(campaign => ({
      name: campaign.name,
      openRate: (campaign.openRate * 100).toFixed(1),
      clickRate: (campaign.clickRate * 100).toFixed(1),
      conversions: campaign.conversions,
      revenue: campaign.revenue
    }));
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Client Dashboard</h1>
        <RangePicker
          value={[dateRange[0], dateRange[1]].map(date => date) as any}
          onChange={(dates) => {
            if (dates) {
              setDateRange([dates[0].toDate(), dates[1].toDate()]);
            }
          }}
        />
      </div>

      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Campaigns"
              value={metrics?.totalCampaigns}
              prefix={<MailOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Average Open Rate"
              value={metrics?.averageOpenRate}
              precision={1}
              suffix="%"
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Conversions"
              value={metrics?.totalConversions}
              prefix={<ShoppingOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={campaigns.reduce((sum, c) => sum + c.revenue, 0)}
              prefix={<DollarOutlined />}
              precision={2}
            />
          </Card>
        </Col>
      </Row>

      <Tabs defaultActiveKey="1">
        <TabPane tab="Performance Overview" key="1">
          <Card title="Campaign Performance" className="mb-6">
            <div style={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={getChartData()}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="openRate"
                    name="Open Rate (%)"
                    stroke="#8884d8"
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="clickRate"
                    name="Click Rate (%)"
                    stroke="#82ca9d"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="conversions"
                    name="Conversions"
                    stroke="#ffc658"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Revenue Trend" className="mb-6">
            <div style={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={getChartData()}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue ($)"
                    stroke="#ff7300"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabPane>

        <TabPane tab="Campaigns" key="2">
          <Card>
            <div className="mb-4 flex justify-between items-center">
              <Select
                style={{ width: 200 }}
                placeholder="Filter by status"
                allowClear
              >
                <Select.Option value="completed">Completed</Select.Option>
                <Select.Option value="running">Running</Select.Option>
                <Select.Option value="scheduled">Scheduled</Select.Option>
                <Select.Option value="failed">Failed</Select.Option>
              </Select>

              <Button type="primary">
                Create Campaign
              </Button>
            </div>

            <Table
              columns={campaignColumns}
              dataSource={campaigns}
              rowKey="id"
              pagination={{
                total: campaigns.length,
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} campaigns`
              }}
            />
          </Card>
        </TabPane>

        <TabPane tab="Settings" key="3">
          <Card title="Client Settings">
            {/* Add client-specific settings here */}
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
}; 