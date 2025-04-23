import React, { useEffect, useState } from 'react';
import {
  Select,
  Radio,
  Slider,
  InputNumber,
  Typography,
  Button,
  Card,
  Modal,
  Table,
} from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Text } = Typography;

export default function UserPreferences() {
  const [portfolioTarget, setPortfolioTarget] = useState();
  const [riskPercentage, setRiskPercentage] = useState(5);
  const [amountOfStocks, setAmountOfStocks] = useState(0);
  const [moneyToInvest, setMoneyToInvest] = useState(0);
  const [selectedStocks, setSelectedStocks] = useState([]);
  const [stocksSpred, setStocksSpred] = useState(null);
  const [portfolioSTD, setPortfolioSTD] = useState(null);
  const [stocksData, setStocksData] = useState([]);
  const [openModalIndex, setOpenModalIndex] = useState(null);
  const [loadingStocksSpred, setLoadingStocksSpred] = useState(false);
  const [totalMinimumWeight, setTotalMinimumWeight] = useState(0);
  const [riskAdjusted, setRiskAdjusted] = useState(false);

  useEffect(() => {
    const fetchStocksData = async () => {
      try {
        const response = await axios.get('http://localhost:8000/stocks/GetAllStocksData');
        setStocksData(response.data);
      } catch (error) {
        console.error('Failed to fetch stocks data:', error);
      }
    };

    fetchStocksData();
  }, []);

  useEffect(() => {
    const total = selectedStocks.reduce((sum, s) => sum + (s?.minimum_weight || 0), 0);
    setTotalMinimumWeight(total);
  }, [selectedStocks]);
  
  const getSliderMax = (index) => {
    const otherTotal = selectedStocks.reduce((sum, s, i) => {
      if (i !== index) return sum + (s?.minimum_weight || 0);
      return sum;
    }, 0);
    return 100 - otherTotal;
  };
  

  const handleStockChange = (index, value, key) => {
    const newStocks = [...selectedStocks];
    if (!newStocks[index]) newStocks[index] = {"minimum_weight":0};
    newStocks[index][key] = value;
    setSelectedStocks(newStocks);
  };

  const calculateStocksSpred = async () => {
    setLoadingStocksSpred(true);
    setRiskAdjusted(false);
    try {
      const requestPayload = {
        risk_percentage: riskPercentage,
        amount_of_stocks: amountOfStocks,
        money_to_invest: moneyToInvest,
        selected_stocks: selectedStocks,
        portfolio_target: portfolioTarget,
      };
      const response = await axios.post('http://localhost:8000/stocks/CalculateSpreadStocks', requestPayload);
      setStocksSpred(response.data.portfolio);
      setPortfolioSTD(response.data.portfolio_std);
      if (response.data.risk_percentage !== riskPercentage) {
        setRiskPercentage(response.data.risk_percentage);
        setRiskAdjusted(true);
      }
    } catch (error) {
      console.error('❌ Error calculating stock spread:', error);
      setStocksSpred([]);
      setPortfolioSTD(null);
    } finally {
      setLoadingStocksSpred(false);
    }
  };

  const generateColumnsFromData = (data) => {
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]).map((key) => ({
      title: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      dataIndex: key,
      key: key,
      render: (value) => {
        if (typeof value === 'number') {
          if (key.toLowerCase().includes('weight')) return `${(value * 100).toFixed(2)}%`;
          if (key.toLowerCase().includes('investment')) return `$${value.toFixed(2)}`;
          if (key.toLowerCase().includes('std')) return value.toFixed(6);
          if (key.toLowerCase().includes('expected_return')) return `${(value * 100).toFixed(2)}%`;
          return value.toFixed(4);
        }
        return value === null ? 'N/A' : value;
      },
    }));
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px',
        backgroundColor: '#141e30',
      }}
    >
      {/* 🎯 Investment Preferences Card */}
      <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'center', width: '100%' }}>
        <Card
          title={<Text style={{ color: '#ffffff', fontSize: '20px' }}>🎯 Investment Preferences</Text>}
          bordered
          style={{
            width: '100%',
            maxWidth: '720px',
            backgroundColor: '#243b55',
            border: '1px solid #243b55',
            marginBottom: '32px',
          }}
          className="shadow-md rounded-lg"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <Text strong style={{ color: '#ffffff' }}>🎯 Portfolio Target:</Text>
              <Radio.Group
                value={portfolioTarget}
                onChange={(e) => setPortfolioTarget(e.target.value)}
                options={[
                  { label: 'Minimize Risk', value: 'min' },
                  { label: 'Maximize Return', value: 'max' },
                ]}
                optionType="button"
                buttonStyle="solid"
                className="mt-2"
              />
            </div>

            {portfolioTarget === 'max' && (
              <div>
                <Text strong style={{ color: '#ffffff' }}>
                  ⚖️ Risk Level: {riskPercentage}% (Target Std: {(0.003 + (riskPercentage - 1) * (0.060 - 0.003) / 99).toFixed(6)})
                </Text>
                <Slider
                  min={1}
                  max={100}
                  value={riskPercentage}
                  onChange={(value) => setRiskPercentage(value)}
                  className="mt-2"
                />
              </div>
            )}

            <div>
              <Text strong style={{ color: '#ffffff' }}>📦 Number of Stocks:</Text>
              <InputNumber
                min={0}
                max={10}
                value={amountOfStocks}
                onChange={(value) => {
                  setAmountOfStocks(value);
                  setSelectedStocks(Array(value).fill(null));
                }}
                className="ml-2"
              />
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center' }}>
              {Array.from({ length: amountOfStocks }, (_, i) => {
                const stockSymbol = selectedStocks[i]?.name;
                const stock = stocksData.find((s) => s.symbol === stockSymbol);

                return (
                  <Card
                    key={i}
                    style={{ width: 300 }}
                    bodyStyle={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Select
                        style={{ flex: 1 }}
                        placeholder="Select a stock"
                        value={selectedStocks[i]?.name || undefined}
                        onChange={(value) => handleStockChange(i, value, 'name')}
                        options={stocksData
                          .map((stock) => ({ label: stock.symbol, value: stock.symbol }))
                          .filter((option) => !selectedStocks.some((s, idx) => s?.name === option.value && idx !== i))}
                      />
                      <InfoCircleOutlined
                        style={{ color: '#1890ff', cursor: 'pointer' }}
                        onClick={() => setOpenModalIndex(i)}
                      />
              </div>

        {selectedStocks[i] && (
          <>
            <Text strong >⚖️ Minimum Stock Weight: {selectedStocks[i]["minimum_weight" || 0]}%</Text>
            <Slider
              min={0}
              max={getSliderMax(i)}
              value={selectedStocks[i]?.minimum_weight || 0}
              onChange={(value) => handleStockChange(i, value, 'minimum_weight')}
            />

            <Modal
              title={
                stock && (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Text style={{ fontSize: '20px', fontWeight: 600, color: '#1890ff' }}>{stock.share}</Text>
                    <Text type="secondary" style={{ fontSize: '14px' }}>({stock.symbol})</Text>
                  </div>
                )
              }
              open={openModalIndex === i}
              onCancel={() => setOpenModalIndex(null)}
              footer={null}
              bodyStyle={{ backgroundColor: '#f9f9f9', borderRadius: 8 }}
            >
              {stock && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p><Text strong>📄 Profile:</Text> <br />{stock.profile}</p>
                  <p><Text strong>📆 Upcoming Events:</Text> <br />{stock.upcoming_events}</p>
                  <p><Text strong>📊 Standard Deviation:</Text> <Text code style={{ color: '#d46b08' }}>{stock.standard_deviation}</Text></p>
                  <p><Text strong>📈 Avg. Annual Life Expectancy:</Text> <Text code style={{ color: '#52c41a' }}>{stock.average_annual_life_expectancy}</Text></p>
                </div>
              )}
            </Modal>
          </>
        )}
      </Card>
    );
  })}
</div>

            <div>
              <Text strong style={{ color: '#ffffff' }}>💰 Money to Invest:</Text>
              <InputNumber
                min={0}
                value={moneyToInvest}
                onChange={(value) => setMoneyToInvest(value)}
                className="ml-2"
                formatter={(val) => `$ ${val}`}
              />
            </div>

            <Button type="primary" onClick={calculateStocksSpred} loading={loadingStocksSpred}>
              🚀 Calculate
            </Button>
          </div>
        </Card>
      </div>

      {stocksSpred && Array.isArray(stocksSpred) && (
        <Card
          title={<Text style={{ fontSize: '20px', color: '#ffffff' }}>📈 Portfolio Results</Text>}
          style={{
            width: '100%',
            maxWidth: '1200px',
            backgroundColor: '#243b55',
            border: '1px solid #243b55',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            borderRadius: '12px',
            marginBottom: '40px',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px' }}>
            <Card
              type="inner"
              title={<Text style={{ color: '#389e0d' }}>🔍 Summary</Text>}
              style={{ minWidth: '260px', flex: '1', backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '10px' }}
              bodyStyle={{ padding: '16px 20px' }}
            >
              {riskAdjusted && (
                <div style={{ marginBottom: '16px', padding: '8px', backgroundColor: '#fffbe6', borderRadius: '4px' }}>
                  <Text type="warning">⚠️ Selected risk level was too low — showing minimum risk portfolio instead.</Text>
                </div>
              )}
              <p><Text strong>Risk Percentage:</Text> {riskPercentage.toFixed(2)}%</p>
              <p><Text strong>Amount of Stocks:</Text> {amountOfStocks}</p>
              <p><Text strong>Money to Invest:</Text> ${moneyToInvest}</p>
              <p>
                <Text strong>Selected Stocks:</Text>{' '}
                {selectedStocks.map(stock => `${stock.name} (min_w: ${stock.minimum_weight}%)`).join(', ')}
              </p>
            </Card>

            <div style={{ flex: '3', minWidth: '400px' }}>
              <Table
                columns={generateColumnsFromData(stocksSpred)}
                dataSource={stocksSpred}
                rowKey={(record, index) => index}
                pagination={false}
                bordered
                size="middle"
                summary={() => (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={generateColumnsFromData(stocksSpred).length}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Text strong>📊 Portfolio Standard Deviation: {typeof portfolioSTD === 'number' ? portfolioSTD.toFixed(6) : 'N/A'}</Text>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Text strong>📈 Portfolio Expected Return: {
                            stocksSpred && stocksSpred.length > 0 
                              ? (stocksSpred.reduce((sum, stock) => sum + (stock.weight * stock.average_expected_return), 0) * 100).toFixed(2) + '%'
                              : 'N/A'
                          }</Text>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Text strong>🎯 Risk Level: {riskPercentage.toFixed(2)}%</Text>
                        </div>
                      </div>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                )}
              />
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}