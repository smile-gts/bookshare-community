// Supabase 配置
const supabaseUrl = 'https://lggwpknpitxaioenqshm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZ3dwa25waXR4YWlvZW5xc2htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4NTcyMDQsImV4cCI6MjA3OTQzMzIwNH0.aFF-VPl4PkoSktqqGy1DrabewhM8MOIL6Ed4XUoZ6vs';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', () => {
    // 标签页切换
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            
            // 更新按钮状态
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // 更新内容显示
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) {
                    content.classList.add('active');
                }
            });
            
            // 加载对应数据
            if (tabId === 'my-books') {
                loadMyBooks();
            } else if (tabId === 'favorites') {
                loadFavorites();
            }
        });
    });
    
    // 退出登录
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await supabase.auth.signOut();
            window.location.reload();
        });
    }
    
    // 初始加载我的图书
    loadMyBooks();
});

// 加载用户自己的图书
async function loadMyBooks() {
    const container = document.getElementById('myBooksContainer');
    if (!container) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    try {
        const { data: books, error } = await supabase
            .from('books')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        container.innerHTML = '';
        
        if (books.length === 0) {
            container.innerHTML = '<p>您还没有分享任何图书</p>';
            return;
        }
        
        books.forEach(book => {
            const bookCard = createBookCard(book, false); // 不显示收藏按钮
            container.appendChild(bookCard);
        });
    } catch (error) {
        console.error('Error loading my books:', error);
        container.innerHTML = '<p>加载失败</p>';
    }
}

// 加载用户收藏的图书
async function loadFavorites() {
    const container = document.getElementById('favoritesContainer');
    if (!container) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    try {
        const { data: favorites, error } = await supabase
            .from('favorites')
            .select(`
                book:book_id (*, users:user_id (username))
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        container.innerHTML = '';
        
        if (favorites.length === 0) {
            container.innerHTML = '<p>您还没有收藏任何图书</p>';
            return;
        }
        
        favorites.forEach(fav => {
            const bookCard = createBookCard(fav.book, true);
            container.appendChild(bookCard);
        });
    } catch (error) {
        console.error('Error loading favorites:', error);
        container.innerHTML = '<p>加载失败</p>';
    }
}

// 创建图书卡片（复用 books.js 中的函数）
function createBookCard(book, showFavorite = true) {
    const card = document.createElement('div');
    card.className = 'book-card';
    
    card.innerHTML = `
        <img src="${book.cover_url || 'https://via.placeholder.com/300x200?text=No+Cover'}" 
             alt="${book.title}" class="book-cover">
        <div class="book-info">
            <h3 class="book-title">${book.title}</h3>
            <p class="book-author">作者: ${book.author}</p>
            <p class="book-description">${book.description || '暂无描述'}</p>
            <div class="book-actions">
                <span class="book-status">状态: ${book.status === 'available' ? '可借阅' : '已借出'}</span>
                ${showFavorite ? `
                    <button class="favorite-btn favorited" onclick="toggleFavorite('${book.id}')">
                        ❤️
                    </button>
                ` : ''}
            </div>
        </div>
    `;
    
    return card;
}

// 切换收藏状态（从 books.js 复制过来，确保在个人页面也能使用）
async function toggleFavorite(bookId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        alert('请先登录');
        return;
    }
    
    try {
        // 检查是否已收藏
        const { data: existingFav } = await supabase
            .from('favorites')
            .select('id')
            .eq('user_id', user.id)
            .eq('book_id', bookId)
            .single();
        
        if (existingFav) {
            // 取消收藏
            await supabase
                .from('favorites')
                .delete()
                .eq('id', existingFav.id);
        } else {
            // 添加收藏
            await supabase
                .from('favorites')
                .insert([
                    {
                        user_id: user.id,
                        book_id: bookId
                    }
                ]);
        }
        
        // 重新加载页面数据
        loadFavorites();
    } catch (error) {
        console.error('Error toggling favorite:', error);
    }
}