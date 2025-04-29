import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Typography, Button, Space, Steps, Input, InputNumber } from 'antd';
import { ArrowLeftOutlined, ArrowRightOutlined, CloseOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Step } = Steps;

const questions = [
  {
    id: 1,
    question: "What is your main investment goal?",
    options: [
      { value: 2, label: "Buy a home" },
      { value: 4, label: "Save for a child's education" },
      { value: 6, label: "Build emergency fund" },
      { value: 8, label: "Generate passive income" },
      { value: 10, label: "Save for retirement" },
      { value: 12, label: "Build long-term wealth" }
    ]
  },
  {
    id: 2,
    question: "When do you plan to use this money?",
    options: [
      { value: 2, label: "Less than 1 year" },
      { value: 5, label: "1-3 years" },
      { value: 10, label: "3-5 years" },
      { value: 15, label: "5-10 years" },
      { value: 20, label: "More than 10 years" }
    ]
  },
  {
    id: 3,
    question: "What is your initial investment amount?",
    type: "number",
    placeholder: "Enter amount in dollars"
  },
  {
    id: 4,
    question: "How much will you invest monthly?",
    type: "number",
    placeholder: "Enter amount in dollars"
  },
  {
    id: 5,
    question: "If your investments dropped 10% in value, what would you do?",
    options: [
      { value: 0, label: "Panic and sell everything" },
      { value: 3, label: "Feel nervous but hold on" },
      { value: 6, label: "Stay calm and wait" },
      { value: 9, label: "See it as a normal market fluctuation" },
      { value: 18, label: "Buy more at the lower price" }
    ]
  }
];

const getRiskProfileMessage = (score) => {
  if (score <= 10) return "You have a very conservative risk profile";
  if (score <= 20) return "You have a conservative risk profile";
  if (score <= 30) return "You have a balanced risk profile";
  if (score <= 40) return "You have a growth-oriented risk profile";
  if (score <= 50) return "You have an aggressive risk profile";
  return "You have a very aggressive risk profile";
};

export default function InvestmentProfile() {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [riskScore, setRiskScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showScore, setShowScore] = useState(false);
  const [initialInvestment, setInitialInvestment] = useState(null);
  const [monthlyInvestment, setMonthlyInvestment] = useState(null);

  const handleSkip = () => {
    navigate('/preferences', { state: { riskScore: 30 } }); // Default to balanced risk
  };

  const handleAnswer = (value) => {
    setSelectedOption(value);
    setAnswers({ ...answers, [currentQuestion]: value });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedOption(answers[currentQuestion + 1] || null);
    } else {
      // Calculate final risk score
      const investmentScore = calculateInvestmentScore();
      const totalScore = Object.values(answers).reduce((sum, value) => sum + value, 0) + investmentScore;
      setRiskScore(Math.round(totalScore));
      setShowScore(true);
    }
  };

  const calculateInvestmentScore = () => {
    if (!initialInvestment || !monthlyInvestment) return 0;
    const annualContribution = monthlyInvestment * 12;
    const ratio = annualContribution / initialInvestment;
    const score = Math.min(12, ratio * 12);
    return score;
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedOption(answers[currentQuestion - 1] || null);
    }
  };

  const handleSubmit = () => {
    navigate('/preferences', { state: { riskScore } });
  };

  const isQuestionAnswered = () => {
    if (currentQuestion === 2) return initialInvestment !== null;
    if (currentQuestion === 3) return monthlyInvestment !== null;
    return answers[currentQuestion] !== undefined;
  };

  const renderInvestmentInputs = () => {
    if (currentQuestion === 2) {
      return (
        <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
          <div style={{ marginBottom: '24px' }}>
            <Text style={{ color: '#ffffff', display: 'block', marginBottom: '8px', textAlign: 'left' }}>
              Initial Investment Amount
            </Text>
            <InputNumber
              style={{
                width: '100%',
                backgroundColor: '#243b55',
                borderColor: '#434343',
                color: '#ffffff'
              }}
              placeholder="e.g., 10000"
              value={initialInvestment}
              onChange={value => setInitialInvestment(value)}
              formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
              min={0}
              step={1000}
              size="large"
              controls={false}
            />
            <Text type="secondary" style={{ color: '#8c8c8c', fontSize: '12px', display: 'block', marginTop: '8px', textAlign: 'left' }}>
              Enter the amount you plan to invest initially
            </Text>
          </div>
        </div>
      );
    }
    if (currentQuestion === 3) {
      return (
        <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
          <div style={{ marginBottom: '24px' }}>
            <Text style={{ color: '#ffffff', display: 'block', marginBottom: '8px', textAlign: 'left' }}>
              Monthly Investment Amount
            </Text>
            <InputNumber
              style={{
                width: '100%',
                backgroundColor: '#243b55',
                borderColor: '#434343',
                color: '#ffffff'
              }}
              placeholder="e.g., 500"
              value={monthlyInvestment}
              onChange={value => setMonthlyInvestment(value)}
              formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
              min={0}
              step={100}
              size="large"
              controls={false}
            />
            <Text type="secondary" style={{ color: '#8c8c8c', fontSize: '12px', display: 'block', marginTop: '8px', textAlign: 'left' }}>
              Enter how much you plan to invest each month
            </Text>
          </div>
        </div>
      );
    }
    return null;
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
          borderColor: '#243b55',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
          borderRadius: '16px',
          position: 'relative'
        }}
      >
        <Button
          type="text"
          icon={<CloseOutlined />}
          onClick={handleSkip}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            color: '#ffffff',
            padding: '4px 8px'
          }}
        >
          Skip
        </Button>

        <Steps
          current={currentQuestion}
          style={{ marginBottom: '32px' }}
        >
          {questions.map((_, index) => (
            <Step key={index} />
          ))}
        </Steps>
        
        {currentQuestion < questions.length ? (
          <>
            <Title level={3} style={{ color: '#ffffff', marginBottom: '24px' }}>
              {questions[currentQuestion].question}
            </Title>
            {questions[currentQuestion].type === "number" ? (
              renderInvestmentInputs()
            ) : (
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {questions[currentQuestion].options.map((option) => (
                  <Button
                    key={option.value}
                    type={selectedOption === option.value ? "primary" : "default"}
                    block
                    onClick={() => handleAnswer(option.value)}
                    style={{ 
                      height: '50px', 
                      fontSize: '16px',
                      backgroundColor: selectedOption === option.value ? '#1890ff' : '#243b55',
                      borderColor: selectedOption === option.value ? '#1890ff' : '#434343',
                      color: selectedOption === option.value ? '#ffffff' : '#ffffff'
                    }}
                  >
                    {option.label}
                  </Button>
                ))}
              </Space>
            )}
            <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'space-between' }}>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={handleBack}
                disabled={currentQuestion === 0}
              >
                Back
              </Button>
              <Button
                type="primary"
                icon={<ArrowRightOutlined />}
                onClick={handleNext}
                disabled={!isQuestionAnswered()}
              >
                {currentQuestion === questions.length - 1 ? 'Calculate Score' : 'Next'}
              </Button>
            </div>
            {showScore && (
              <div style={{ 
                marginTop: '32px',
                padding: '24px',
                backgroundColor: '#1a2a3a',
                borderRadius: '8px',
                transition: 'all 0.3s ease'
              }}>
                <Text style={{ fontSize: '24px', color: '#ffffff', marginBottom: '16px', display: 'block' }}>
                  Your Risk Score: {riskScore} points
                </Text>
                <Text style={{ fontSize: '18px', color: '#ffffff', marginBottom: '24px', display: 'block' }}>
                  {getRiskProfileMessage(riskScore)}
                </Text>
                <Button
                  type="primary"
                  size="large"
                  onClick={handleSubmit}
                  style={{ width: '100%' }}
                >
                  Continue to Investment Preferences
                </Button>
              </div>
            )}
          </>
        ) : (
          <>
            <Title level={3} style={{ color: '#ffffff', marginBottom: '24px' }}>
              Your Risk Profile
            </Title>
            <Text style={{ fontSize: '24px', color: '#ffffff', marginBottom: '16px', display: 'block' }}>
              Risk Score: {riskScore} points
            </Text>
            <Text style={{ fontSize: '18px', color: '#ffffff', marginBottom: '32px', display: 'block' }}>
              {getRiskProfileMessage(riskScore)}
            </Text>
            <div style={{ marginBottom: '24px' }}>
              <Text style={{ color: '#ffffff', display: 'block' }}>
                This score will help us recommend the best investment strategy for you.
              </Text>
              <Text style={{ color: '#ffffff', display: 'block' }}>
                You can adjust your risk preferences later in the investment settings.
              </Text>
            </div>
            <Button
              type="primary"
              size="large"
              onClick={handleSubmit}
            >
              Continue to Investment Preferences
            </Button>
          </>
        )}
      </Card>
    </div>
  );
} 