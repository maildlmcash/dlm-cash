import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.ETHERSCAN_API_KEY;

console.log('\n🔍 Testing Etherscan API Key...');
console.log(`API Key from .env: ${API_KEY ? API_KEY.substring(0, 8) + '...' : 'MISSING'}`);

(async () => {
  try {
    // Test Sepolia V1
    console.log('\n📡 Testing Sepolia (V1)...');
    const sepoliaUrl = 'https://api-sepolia.etherscan.io/api';
    const sepoliaParams = {
      module: 'account',
      action: 'balance',
      address: '0x663251A056e22E994ceD8C3FA7Dab2Ba004a2912',
      tag: 'latest',
      apikey: API_KEY,
    };
    
    const sepoliaResponse = await axios.get(sepoliaUrl, { params: sepoliaParams });
    console.log('Sepolia Response:', JSON.stringify(sepoliaResponse.data, null, 2));
    
    // Test Ethereum V2
    console.log('\n📡 Testing Ethereum Mainnet (V2)...');
    const ethUrl = 'https://api.etherscan.io/v2/api';
    const ethParams = {
      chainid: 1,
      module: 'account',
      action: 'balance',
      address: '0x663251A056e22E994ceD8C3FA7Dab2Ba004a2912',
      tag: 'latest',
      apikey: API_KEY,
    };
    
    const ethResponse = await axios.get(ethUrl, { params: ethParams });
    console.log('Ethereum Response:', JSON.stringify(ethResponse.data, null, 2));
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
})();
