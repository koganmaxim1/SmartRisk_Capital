import React from 'react';
import { Button, Card, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

export default function LeadingPage() {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/preferences'); // route to UserPreferences component
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#141e30',
      padding: '24px'
    }}>
      <Card
        style={{
          maxWidth: 600,
          width: '100%',
          textAlign: 'center',
          padding: '40px',
          backgroundColor: '#243b55',
          borderColor :'#243b55',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
          borderRadius: '16px'
        }}
      >

        <img
            src="/assets/logo.png"
            alt="SmartRisk Capital Logo"
            style={{
                width: '100%',
                maxWidth: '300px',
                height: 'auto',
                marginBottom: '24px',
                objectFit: 'contain'
            }}
        />
        <Title level={2} style={{ color: '#ffffff' }}>Welcome to SmartRisk Capital</Title>
        <Text style={{ fontSize: '16px', color: '#ffffff' }}>
          Optimize your investment portfolio using proven financial strategies.
          Personalize your preferences and let our algorithm guide your decisions.
        </Text>
        <br />
        <Button
          type="primary"
          size="large"
          onClick={handleStart}
          style={{ marginTop: '32px'}}
        >
          Start Here
        </Button>
      </Card>
    </div>
  );
}