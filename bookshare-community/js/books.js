// Supabase 配置
const supabaseUrl = 'https://lggwpknpitxaioenqshm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZ3dwa25waXR4YWlvZW5xc2htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4NTcyMDQsImV4cCI6MjA3OTQzMzIwNH0.aFF-VPl4PkoSktqqGy1DrabewhM8MOIL6Ed4XUoZ6vs';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', () => {
    loadBooks();
    
    const addBookBtn = document.getElementById('addBookBtn');
    const bookForm = document.getElementById('bookForm');
    const newBookForm = document.getElementById('newBookForm');
    
    if (addBookBtn) {
        addBookBtn.addEventListener('click', () => {
            bookForm.style.display = bookForm.style.display === 'none' ? 'block' : 'none';
        });
    }
    
    if (newBookForm) {
        newBookForm.addEventListener('submit', addNewBook);
    }
});

// 加载所有图书
async function loadBooks() {
    const booksContainer = document.getElementById('booksContainer');
    if (!booksContainer) return;
    
    try {
        const { data: books, error } = await supabase
            .from('books')
            .select(`
                *,
                users:user_id (username),
                favorites (id)
            `)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        booksContainer.innerHTML = '';
        
        if (books.length === 0) {
            booksContainer.innerHTML = '<p>暂无图书分享</p>';
            return;
        }
        
        books.forEach(book => {
            const bookCard = createBookCard(book);
            booksContainer.appendChild(bookCard);
        });
    } catch (error) {
        console.error('Error loading books:', error);
        booksContainer.innerHTML = '<p>加载失败，请刷新重试</p>';
    }
}

// 创建图书卡片
function createBookCard(book) {
    const card = document.createElement('div');
    card.className = 'book-card';
    
    const isFavorite = book.favorites && book.favorites.length > 0;
    
    card.innerHTML = `
        <img src="${book.cover_url || 'https://via.placeholder.com/300x200?text=No+Cover'}" 
             alt="${book.title}" class="book-cover">
        <div class="book-info">
            <h3 class="book-title">${book.title}</h3>
            <p class="book-author">作者: ${book.author}</p>
            <p class="book-description">${book.description || '暂无描述'}</p>
            <div class="book-actions">
                <span class="book-owner">分享者: ${book.users.username}</span>
                <button class="favorite-btn ${isFavorite ? 'favorited' : ''}" 
                        onclick="toggleFavorite('${book.id}')">
                    ${isFavorite ? '❤️' : '🤍'}
                </button>
            </div>
        </div>
    `;
    
    return card;
}

// 添加新图书
async function addNewBook(e) {
    e.preventDefault();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        alert('请先登录');
        return;
    }
    
    const title = document.getElementById('bookTitle').value;
    const author = document.getElementById('bookAuthor').value;
    const description = document.getElementById('bookDescription').value;
    const cover_url = document.getElementById('bookCover').value;
    
    try {
        const { error } = await supabase
            .from('books')
            .insert([
                {
                    title,
                    author,
                    description,
                    cover_url: cover_url || null,
                    user_id: user.id
                }
            ]);
        
        if (error) throw error;
        
        // 清空表单
        e.target.reset();
        document.getElementById('bookForm').style.display = 'none';
        
        // 重新加载图书列表
        loadBooks();
        
        alert('图书添加成功！');
    } catch (error) {
        console.error('Error adding book:', error);
        alert('添加失败: ' + error.message);
    }
}

// 切换收藏状态
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
        
        // 重新加载图书列表
        loadBooks();
    } catch (error) {
        console.error('Error toggling favorite:', error);
    }
}