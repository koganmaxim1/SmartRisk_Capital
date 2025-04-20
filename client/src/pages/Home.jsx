import React from 'react';
import { Typography, Button, Layout } from 'antd';
import { Link } from 'react-router-dom';
import { DollarOutlined } from '@ant-design/icons';

const { Content } = Layout;
const { Title, Paragraph } = Typography;

const Home = () => {
  return (
    <Layout>
      <Content>
        <div style={{ 
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #141e30 0%, #243b55 100%)',
          padding: '40px 20px'
        }}>
          {/* Hero Section */}
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '40px',
            padding: '60px 0'
          }}>
            {/* Left Side - Text Content */}
            <div style={{ flex: 1 }}>
              <Title style={{ 
                color: '#fff',
                fontSize: '48px',
                marginBottom: '24px',
                fontWeight: 'bold'
              }}>
                Smarter Investing.<br />
                Built Around<br />
                Your Risk.
              </Title>
              <Paragraph style={{ 
                color: '#fff',
                fontSize: '18px',
                marginBottom: '32px'
              }}>
                SmartRisk Capital helps you build optimized portfolios
                using real data and modern risk analysis.
              </Paragraph>
              <div style={{ display: 'flex', gap: '16px' }}>
                <Button type="primary" size="large">
                  <Link to="/get-started">Get Started Now</Link>
                </Button>
                <Button size="large" ghost>
                  See How It Works
                </Button>
              </div>
            </div>

            {/* Right Side - Logo/Image */}
            <div style={{ 
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <div style={{
                background: '#fff',
                padding: '40px',
                borderRadius: '12px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                textAlign: 'center'
              }}>
                <DollarOutlined style={{ 
                  fontSize: '64px',
                  color: '#003366',
                  marginBottom: '20px'
                }} />
                <Title level={2} style={{ 
                  color: '#003366',
                  margin: 0
                }}>
                  SMARTRISK CAPITAL
                </Title>
                <Paragraph style={{ 
                  color: '#003366',
                  margin: '8px 0 0 0'
                }}>
                  YOUR STOCKS OUR RISK
                </Paragraph>
                <Paragraph style={{ 
                  color: '#666',
                  fontSize: '12px',
                  margin: '20px 0 0 0'
                }}>
                  Live portfolio optimization example
                </Paragraph>
              </div>
            </div>
          </div>

          {/* Survey Link */}
          <div style={{
            textAlign: 'center',
            marginTop: '40px'
          }}>
            <Paragraph style={{ color: '#fff' }}>
              Want to help us improve?{' '}
              <Link to="/survey" style={{ color: '#1890ff' }}>
                Take our short user survey
              </Link>
            </Paragraph>
          </div>
        </div>
      </Content>
    </Layout>
  );
};

export default Home; 