import React from 'react';
import { Layout, Menu, Button } from 'antd';
import { Link } from 'react-router-dom';
import { HomeOutlined, InfoCircleOutlined, RocketOutlined, StockOutlined, QuestionOutlined, TeamOutlined, ClockCircleOutlined, MailOutlined } from '@ant-design/icons';

const { Header } = Layout;

const Navbar = () => {
  return (
    <Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '0 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Link to="/" style={{ fontSize: '24px', fontWeight: 'bold', color: '#003366', marginRight: '40px' }}>
          SRC
        </Link>
        <Menu mode="horizontal" defaultSelectedKeys={['home']}>
          <Menu.Item key="home" icon={<HomeOutlined />}>
            <Link to="/">Home</Link>
          </Menu.Item>
          <Menu.Item key="about" icon={<InfoCircleOutlined />}>
            <Link to="/about">About Us</Link>
          </Menu.Item>
          <Menu.Item key="get-started" icon={<RocketOutlined />}>
            <Link to="/get-started">Get Started</Link>
          </Menu.Item>
          <Menu.Item key="market-news" icon={<StockOutlined />}>
            <Link to="/market-news">Stock Market News</Link>
          </Menu.Item>
          <Menu.Item key="analysis" icon={<StockOutlined />}>
            <Link to="/analysis">Analysis</Link>
          </Menu.Item>
          <Menu.Item key="faq" icon={<QuestionOutlined />}>
            <Link to="/faq">FAQ</Link>
          </Menu.Item>
          <Menu.Item key="community" icon={<TeamOutlined />}>
            <Link to="/community">Community</Link>
          </Menu.Item>
          <Menu.Item key="coming" icon={<ClockCircleOutlined />}>
            <Link to="/coming">What's Coming</Link>
          </Menu.Item>
          <Menu.Item key="contact" icon={<MailOutlined />}>
            <Link to="/contact">Contact Us</Link>
          </Menu.Item>
        </Menu>
      </div>
      <div>
        <Button type="link" style={{ marginRight: '10px' }}>Login</Button>
        <Button type="primary">Sign Up</Button>
      </div>
    </Header>
  );
};

export default Navbar; 