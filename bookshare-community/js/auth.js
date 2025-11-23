// Supabase 配置
const supabaseUrl = 'https://lggwpknpitxaioenqshm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZ3dwa25waXR4YWlvZW5xc2htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4NTcyMDQsImV4cCI6MjA3OTQzMzIwNH0.aFF-VPl4PkoSktqqGy1DrabewhM8MOIL6Ed4XUoZ6vs';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// DOM 元素
const authButton = document.getElementById('authButton');
const authModal = document.getElementById('authModal');
const closeModal = document.querySelector('.close');
const authForm = document.getElementById('authForm');
const switchToSignup = document.getElementById('switchToSignup');
let isSignUp = false;

// 事件监听器
document.addEventListener('DOMContentLoaded', () => {
    checkAuthState();
    
    if (authButton) {
        authButton.addEventListener('click', toggleAuthModal);
    }
    
    if (closeModal) {
        closeModal.addEventListener('click', closeAuthModal);
    }
    
    if (authForm) {
        authForm.addEventListener('submit', handleAuth);
    }
    
    if (switchToSignup) {
        switchToSignup.addEventListener('click', (e) => {
            e.preventDefault();
            toggleAuthMode();
        });
    }
});

// 检查认证状态
async function checkAuthState() {
    const { data: { session } } = await supabase.auth.getSession();
    updateUI(session?.user);
}

// 更新UI基于认证状态
function updateUI(user) {
    const authButton = document.getElementById('authButton');
    const addBookBtn = document.getElementById('addBookBtn');
    const bookForm = document.getElementById('bookForm');
    const userInfo = document.getElementById('userInfo');
    const userEmail = document.getElementById('userEmail');
    
    if (user) {
        if (authButton) authButton.textContent = '退出';
        if (addBookBtn) addBookBtn.style.display = 'block';
        if (userInfo) {
            userInfo.style.display = 'block';
            userEmail.textContent = user.email;
        }
    } else {
        if (authButton) authButton.textContent = '登录';
        if (addBookBtn) addBookBtn.style.display = 'none';
        if (bookForm) bookForm.style.display = 'none';
        if (userInfo) userInfo.style.display = 'none';
    }
}

// 切换认证模态框
async function toggleAuthModal() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        // 如果已登录，点击退出
        await supabase.auth.signOut();
        updateUI(null);
        window.location.reload();
    } else {
        // 如果未登录，显示登录模态框
        authModal.style.display = 'block';
    }
}

function closeAuthModal() {
    authModal.style.display = 'none';
}

// 切换登录/注册模式
function toggleAuthMode() {
    isSignUp = !isSignUp;
    const submitBtn = authForm.querySelector('button[type="submit"]');
    const switchText = document.querySelector('#switchToSignup').parentNode;
    
    if (isSignUp) {
        submitBtn.textContent = '注册';
        switchText.innerHTML = '已有账号？<a href="#" id="switchToSignup">立即登录</a>';
    } else {
        submitBtn.textContent = '登录';
        switchText.innerHTML = '还没有账号？<a href="#" id="switchToSignup">立即注册</a>';
    }
    
    // 重新绑定事件
    document.getElementById('switchToSignup').addEventListener('click', (e) => {
        e.preventDefault();
        toggleAuthMode();
    });
}

// 处理认证
async function handleAuth(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        let result;
        if (isSignUp) {
            result = await supabase.auth.signUp({
                email,
                password,
            });
        } else {
            result = await supabase.auth.signInWithPassword({
                email,
                password,
            });
        }
        
        if (result.error) throw result.error;
        
        if (result.data.user) {
            // 创建用户记录（如果注册）
            if (isSignUp) {
                await supabase
                    .from('users')
                    .insert([
                        { 
                            id: result.data.user.id, 
                            email: result.data.user.email,
                            username: result.data.user.email.split('@')[0]
                        }
                    ]);
            }
            
            closeAuthModal();
            updateUI(result.data.user);
            window.location.reload();
        }
    } catch (error) {
        alert(error.message);
    }
}

// 点击模态框外部关闭
window.addEventListener('click', (e) => {
    if (e.target === authModal) {
        closeAuthModal();
    }
});