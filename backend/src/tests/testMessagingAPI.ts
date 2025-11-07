import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/v1';

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL';
  message: string;
  data?: any;
}

const results: TestResult[] = [];

// Store tokens and IDs for tests
let clientToken = '';
let freelancerToken = '';
let clientId = '';
let freelancerId = '';
let projectId = '';
let proposalId = '';
let conversationId = '';
let messageId = '';

// Axios instances
let clientAPI: AxiosInstance;
let freelancerAPI: AxiosInstance;

// Helper function to log results
function logResult(test: string, status: 'PASS' | 'FAIL', message: string, data?: any) {
  results.push({ test, status, message, data });
  const icon = status === 'PASS' ? '✅' : '❌';
  console.log(`${icon} ${test}: ${message}`);
  if (data) {
    console.log('   Data:', JSON.stringify(data, null, 2));
  }
}

// Helper function to handle errors
function handleError(test: string, error: any) {
  const message = error.response?.data?.message || error.message || 'Unknown error';
  logResult(test, 'FAIL', message, error.response?.data);
}

// Test 1: Register Client
async function testRegisterClient() {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, {
      email: `client.test.${Date.now()}@freetun.com`,
      password: 'TestPassword123!',
      role: 'client',
      full_name: 'Test Client User'
    });

    clientToken = response.data.data.token;
    clientId = response.data.data.user.id;
    
    clientAPI = axios.create({
      baseURL: API_BASE_URL,
      headers: { Authorization: `Bearer ${clientToken}` }
    });

    logResult('Register Client', 'PASS', 'Client registered successfully', {
      userId: clientId,
      role: 'client'
    });
  } catch (error: any) {
    handleError('Register Client', error);
    throw error;
  }
}

// Test 2: Register Freelancer
async function testRegisterFreelancer() {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, {
      email: `freelancer.test.${Date.now()}@freetun.com`,
      password: 'TestPassword123!',
      role: 'freelancer',
      full_name: 'Test Freelancer User'
    });

    freelancerToken = response.data.data.token;
    freelancerId = response.data.data.user.id;
    
    freelancerAPI = axios.create({
      baseURL: API_BASE_URL,
      headers: { Authorization: `Bearer ${freelancerToken}` }
    });

    logResult('Register Freelancer', 'PASS', 'Freelancer registered successfully', {
      userId: freelancerId,
      role: 'freelancer'
    });
  } catch (error: any) {
    handleError('Register Freelancer', error);
    throw error;
  }
}

// Test 3: Get Categories
async function testGetCategories() {
  try {
    const response = await axios.get(`${API_BASE_URL}/projects/categories`);
    
    if (response.data.data && response.data.data.length > 0) {
      logResult('Get Categories', 'PASS', `Retrieved ${response.data.data.length} categories`);
      return response.data.data[0].id;
    } else {
      throw new Error('No categories found');
    }
  } catch (error: any) {
    handleError('Get Categories', error);
    throw error;
  }
}

// Test 4: Create Project
async function testCreateProject(categoryId: string) {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 30);

    const response = await clientAPI.post('/projects', {
      title: 'Test Messaging Project - Full Stack Development',
      description: 'Testing messaging system with a real project scenario',
      category_id: categoryId,
      budget_min: 500,
      budget_max: 1000,
      deadline: tomorrow.toISOString(),
      skills_required: ['React', 'Node.js', 'Socket.IO']
    });

    projectId = response.data.data.id;
    logResult('Create Project', 'PASS', 'Project created successfully', {
      projectId,
      title: response.data.data.title
    });
  } catch (error: any) {
    handleError('Create Project', error);
    throw error;
  }
}

// Test 5: Submit Proposal
async function testSubmitProposal() {
  try {
    const response = await freelancerAPI.post('/proposals', {
      project_id: projectId,
      cover_letter: 'I am interested in working on this project. I have extensive experience with messaging systems.',
      proposed_budget: 750,
      delivery_time: 14
    });

    proposalId = response.data.data.id;
    logResult('Submit Proposal', 'PASS', 'Proposal submitted successfully', {
      proposalId,
      budget: response.data.data.proposed_budget
    });
  } catch (error: any) {
    handleError('Submit Proposal', error);
    throw error;
  }
}

// Test 6: Accept Proposal
async function testAcceptProposal() {
  try {
    const response = await clientAPI.patch(`/proposals/${proposalId}/accept`);
    
    logResult('Accept Proposal', 'PASS', 'Proposal accepted successfully', {
      status: response.data.data.status
    });
  } catch (error: any) {
    handleError('Accept Proposal', error);
    throw error;
  }
}

// Test 7: Create Conversation (should fail - freelancer cannot create)
async function testCreateConversationAsFreelancer() {
  try {
    await freelancerAPI.post('/messages/conversations', {
      project_id: projectId
    });
    
    logResult('Create Conversation as Freelancer', 'FAIL', 'Should not allow freelancer to create conversation');
  } catch (error: any) {
    if (error.response?.status === 403) {
      logResult('Create Conversation as Freelancer', 'PASS', 'Correctly rejected freelancer attempt');
    } else {
      handleError('Create Conversation as Freelancer', error);
    }
  }
}

// Test 8: Create Conversation (client)
async function testCreateConversation() {
  try {
    const response = await clientAPI.post('/messages/conversations', {
      project_id: projectId
    });

    conversationId = response.data.data.id;
    logResult('Create Conversation', 'PASS', 'Conversation created successfully', {
      conversationId,
      clientId: response.data.data.client_id,
      freelancerId: response.data.data.freelancer_id
    });
  } catch (error: any) {
    handleError('Create Conversation', error);
    throw error;
  }
}

// Test 9: Get Conversations (Client)
async function testGetConversationsAsClient() {
  try {
    const response = await clientAPI.get('/messages/conversations');
    
    if (response.data.data.conversations.length > 0) {
      logResult('Get Conversations (Client)', 'PASS', `Retrieved ${response.data.data.conversations.length} conversations`, {
        totalCount: response.data.data.totalCount,
        unreadCount: response.data.data.conversations[0].unread_count_client
      });
    } else {
      throw new Error('No conversations found');
    }
  } catch (error: any) {
    handleError('Get Conversations (Client)', error);
  }
}

// Test 10: Get Conversations (Freelancer)
async function testGetConversationsAsFreelancer() {
  try {
    const response = await freelancerAPI.get('/messages/conversations');
    
    if (response.data.data.conversations.length > 0) {
      logResult('Get Conversations (Freelancer)', 'PASS', `Retrieved ${response.data.data.conversations.length} conversations`, {
        totalCount: response.data.data.totalCount,
        unreadCount: response.data.data.conversations[0].unread_count_freelancer
      });
    } else {
      throw new Error('No conversations found');
    }
  } catch (error: any) {
    handleError('Get Conversations (Freelancer)', error);
  }
}

// Test 11: Send Message (Client)
async function testSendMessageAsClient() {
  try {
    const response = await clientAPI.post(`/messages/conversations/${conversationId}/messages`, {
      content: 'Hello! I\'m excited to work with you on this project. When can we start?'
    });

    messageId = response.data.data.id;
    logResult('Send Message (Client)', 'PASS', 'Message sent successfully', {
      messageId,
      content: response.data.data.content,
      senderId: response.data.data.sender_id
    });
  } catch (error: any) {
    handleError('Send Message (Client)', error);
    throw error;
  }
}

// Test 12: Send Message (Freelancer)
async function testSendMessageAsFreelancer() {
  try {
    const response = await freelancerAPI.post(`/messages/conversations/${conversationId}/messages`, {
      content: 'Hi! Thank you for accepting my proposal. I can start immediately. Let me know the first steps.'
    });

    logResult('Send Message (Freelancer)', 'PASS', 'Message sent successfully', {
      messageId: response.data.data.id,
      content: response.data.data.content
    });
  } catch (error: any) {
    handleError('Send Message (Freelancer)', error);
  }
}

// Test 13: Send Message with Long Content
async function testSendLongMessage() {
  try {
    const longContent = 'A'.repeat(5001); // Exceeds 5000 character limit
    
    await clientAPI.post(`/messages/conversations/${conversationId}/messages`, {
      content: longContent
    });
    
    logResult('Send Long Message', 'FAIL', 'Should not allow messages over 5000 characters');
  } catch (error: any) {
    if (error.response?.status === 400) {
      logResult('Send Long Message', 'PASS', 'Correctly rejected message over character limit');
    } else {
      handleError('Send Long Message', error);
    }
  }
}

// Test 14: Send Empty Message
async function testSendEmptyMessage() {
  try {
    await clientAPI.post(`/messages/conversations/${conversationId}/messages`, {
      content: ''
    });
    
    logResult('Send Empty Message', 'FAIL', 'Should not allow empty messages');
  } catch (error: any) {
    if (error.response?.status === 400) {
      logResult('Send Empty Message', 'PASS', 'Correctly rejected empty message');
    } else {
      handleError('Send Empty Message', error);
    }
  }
}

// Test 15: Get Messages (Client)
async function testGetMessagesAsClient() {
  try {
    const response = await clientAPI.get(`/messages/conversations/${conversationId}/messages`);
    
    if (response.data.data.messages.length >= 2) {
      logResult('Get Messages (Client)', 'PASS', `Retrieved ${response.data.data.messages.length} messages`, {
        totalCount: response.data.data.totalCount,
        firstMessage: response.data.data.messages[0].content.substring(0, 50)
      });
    } else {
      throw new Error('Expected at least 2 messages');
    }
  } catch (error: any) {
    handleError('Get Messages (Client)', error);
  }
}

// Test 16: Get Messages with Pagination
async function testGetMessagesWithPagination() {
  try {
    const response = await clientAPI.get(`/messages/conversations/${conversationId}/messages?page=1&limit=1`);
    
    if (response.data.data.messages.length === 1) {
      logResult('Get Messages with Pagination', 'PASS', 'Pagination working correctly', {
        currentPage: response.data.data.currentPage,
        limit: response.data.data.limit,
        totalCount: response.data.data.totalCount
      });
    } else {
      throw new Error('Pagination not working as expected');
    }
  } catch (error: any) {
    handleError('Get Messages with Pagination', error);
  }
}

// Test 17: Mark Messages as Read (Client)
async function testMarkAsReadAsClient() {
  try {
    const response = await clientAPI.patch(`/messages/conversations/${conversationId}/read`);
    
    logResult('Mark as Read (Client)', 'PASS', 'Messages marked as read', {
      markedCount: response.data.data.markedCount
    });
  } catch (error: any) {
    handleError('Mark as Read (Client)', error);
  }
}

// Test 18: Verify Unread Count Reset
async function testVerifyUnreadCountReset() {
  try {
    const response = await clientAPI.get('/messages/conversations');
    const conversation = response.data.data.conversations.find((c: any) => c.id === conversationId);
    
    if (conversation && conversation.unread_count_client === 0) {
      logResult('Verify Unread Count Reset', 'PASS', 'Unread count correctly reset to 0');
    } else {
      throw new Error(`Expected unread_count_client to be 0, got ${conversation?.unread_count_client}`);
    }
  } catch (error: any) {
    handleError('Verify Unread Count Reset', error);
  }
}

// Test 19: Delete Message (unauthorized user)
async function testDeleteMessageUnauthorized() {
  try {
    await freelancerAPI.delete(`/messages/${messageId}`);
    
    logResult('Delete Message (Unauthorized)', 'FAIL', 'Should not allow user to delete other user\'s message');
  } catch (error: any) {
    if (error.response?.status === 403) {
      logResult('Delete Message (Unauthorized)', 'PASS', 'Correctly rejected unauthorized deletion');
    } else {
      handleError('Delete Message (Unauthorized)', error);
    }
  }
}

// Test 20: Delete Message (authorized user)
async function testDeleteMessage() {
  try {
    const response = await clientAPI.delete(`/messages/${messageId}`);
    
    logResult('Delete Message', 'PASS', 'Message deleted successfully', {
      messageId
    });
  } catch (error: any) {
    handleError('Delete Message', error);
  }
}

// Test 21: Verify Message is Soft Deleted
async function testVerifyMessageSoftDeleted() {
  try {
    const response = await clientAPI.get(`/messages/conversations/${conversationId}/messages`);
    const deletedMessage = response.data.data.messages.find((m: any) => m.id === messageId);
    
    if (!deletedMessage) {
      logResult('Verify Message Soft Deleted', 'PASS', 'Deleted message not visible in conversation');
    } else {
      throw new Error('Deleted message should not be visible');
    }
  } catch (error: any) {
    handleError('Verify Message Soft Deleted', error);
  }
}

// Test 22: Access Conversation from Unauthorized User
async function testUnauthorizedConversationAccess() {
  try {
    // Register a third user
    const thirdUserResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
      email: `unauthorized.test.${Date.now()}@freetun.com`,
      password: 'TestPassword123!',
      role: 'freelancer',
      full_name: 'Unauthorized User'
    });

    const unauthorizedAPI = axios.create({
      baseURL: API_BASE_URL,
      headers: { Authorization: `Bearer ${thirdUserResponse.data.data.token}` }
    });

    await unauthorizedAPI.get(`/messages/conversations/${conversationId}/messages`);
    
    logResult('Unauthorized Conversation Access', 'FAIL', 'Should not allow unauthorized access');
  } catch (error: any) {
    if (error.response?.status === 403) {
      logResult('Unauthorized Conversation Access', 'PASS', 'Correctly rejected unauthorized access');
    } else {
      handleError('Unauthorized Conversation Access', error);
    }
  }
}

// Test 23: Send Multiple Messages
async function testSendMultipleMessages() {
  try {
    const messages = [
      'Great! Let\'s discuss the requirements.',
      'Can you provide more details about the tech stack?',
      'Also, what\'s the timeline for each milestone?'
    ];

    let successCount = 0;
    for (const content of messages) {
      const response = await freelancerAPI.post(`/messages/conversations/${conversationId}/messages`, {
        content
      });
      if (response.data.data.id) {
        successCount++;
      }
    }

    if (successCount === messages.length) {
      logResult('Send Multiple Messages', 'PASS', `Successfully sent ${successCount} messages`);
    } else {
      throw new Error(`Only ${successCount}/${messages.length} messages sent`);
    }
  } catch (error: any) {
    handleError('Send Multiple Messages', error);
  }
}

// Test 24: Get Final Message Count
async function testGetFinalMessageCount() {
  try {
    const response = await clientAPI.get(`/messages/conversations/${conversationId}/messages`);
    
    logResult('Get Final Message Count', 'PASS', `Total messages in conversation: ${response.data.data.totalCount}`, {
      visibleMessages: response.data.data.messages.length,
      totalCount: response.data.data.totalCount
    });
  } catch (error: any) {
    handleError('Get Final Message Count', error);
  }
}

// Main test runner
async function runAllTests() {
  console.log('\n🚀 Starting FreeTun Messaging System Tests\n');
  console.log('=' .repeat(60));
  
  try {
    // Setup tests
    console.log('\n📋 SETUP: User Registration & Project Creation\n');
    await testRegisterClient();
    await testRegisterFreelancer();
    const categoryId = await testGetCategories();
    await testCreateProject(categoryId);
    await testSubmitProposal();
    await testAcceptProposal();

    // Conversation tests
    console.log('\n💬 CONVERSATION TESTS\n');
    await testCreateConversationAsFreelancer();
    await testCreateConversation();
    await testGetConversationsAsClient();
    await testGetConversationsAsFreelancer();

    // Message tests
    console.log('\n✉️  MESSAGE TESTS\n');
    await testSendMessageAsClient();
    await testSendMessageAsFreelancer();
    await testSendLongMessage();
    await testSendEmptyMessage();
    await testGetMessagesAsClient();
    await testGetMessagesWithPagination();

    // Read receipt tests
    console.log('\n📬 READ RECEIPT TESTS\n');
    await testMarkAsReadAsClient();
    await testVerifyUnreadCountReset();

    // Delete tests
    console.log('\n🗑️  DELETE TESTS\n');
    await testDeleteMessageUnauthorized();
    await testDeleteMessage();
    await testVerifyMessageSoftDeleted();

    // Security tests
    console.log('\n🔒 SECURITY TESTS\n');
    await testUnauthorizedConversationAccess();

    // Additional tests
    console.log('\n📊 ADDITIONAL TESTS\n');
    await testSendMultipleMessages();
    await testGetFinalMessageCount();

  } catch (error) {
    console.error('\n❌ Test suite failed with critical error:', error);
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 TEST SUMMARY\n');
  
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const total = results.length;
  const passRate = ((passed / total) * 100).toFixed(1);

  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Pass Rate: ${passRate}%`);

  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`   - ${r.test}: ${r.message}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  
  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests();
