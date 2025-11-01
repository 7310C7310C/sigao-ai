/**
 * 思高圣经前端路由系统
 * Hash 路由实现，ES5 语法兼容旧浏览器
 */

(function() {
    'use strict';
    
    // 全局状态
    var appState = {
        currentRoute: null,
        loading: false,
        cache: {}
    };
    
    /**
     * 显示/隐藏加载动画
     */
    function toggleLoading(show) {
        var loading = document.getElementById('loading');
        if (loading) {
            if (show) {
                loading.className = 'loading-spinner active';
            } else {
                loading.className = 'loading-spinner';
            }
        }
        appState.loading = show;
    }
    
    /**
     * 显示错误信息
     */
    function showError(message) {
        var errorDiv = document.getElementById('error');
        var errorText = document.getElementById('error-text');
        if (errorDiv && errorText) {
            errorText.textContent = message;
            errorDiv.className = 'error-message active';
            setTimeout(function() {
                errorDiv.className = 'error-message';
            }, 5000);
        }
    }
    
    /**
     * AJAX 请求封装（兼容旧浏览器）
     */
    function ajaxGet(url, callback) {
        // 检查缓存
        if (appState.cache[url]) {
            callback(null, appState.cache[url]);
            return;
        }
        
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    try {
                        var data = JSON.parse(xhr.responseText);
                        // 缓存结果
                        appState.cache[url] = data;
                        callback(null, data);
                    } catch (e) {
                        callback(e);
                    }
                } else {
                    callback(new Error('请求失败: ' + xhr.status));
                }
            }
        };
        
        xhr.onerror = function() {
            callback(new Error('网络错误'));
        };
        
        xhr.send();
    }
    
    /**
     * 渲染书卷列表（分组显示）
     */
    function renderBookList(books) {
        // 按约和类别分组
        var testaments = {
            '新约': {},
            '旧约': {}
        };
        
        for (var i = 0; i < books.length; i++) {
            var book = books[i];
            var testament = book.testament || '其他';
            var bookType = book.book_type || '其他';
            
            if (!testaments[testament]) {
                testaments[testament] = {};
            }
            if (!testaments[testament][bookType]) {
                testaments[testament][bookType] = [];
            }
            testaments[testament][bookType].push(book);
        }
        
        var html = '<div class="container">';
        html += '<h1>📖 思高圣经</h1>';
        
        // 渲染新约
        if (testaments['新约'] && Object.keys(testaments['新约']).length > 0) {
            html += '<div class="testament-section">';
            html += '<h2 class="testament-title">新约</h2>';
            
            for (var bookType in testaments['新约']) {
                html += '<div class="book-type-section">';
                html += '<h3 class="book-type-title">' + bookType + '</h3>';
                html += '<ul class="book-list">';
                
                var booksList = testaments['新约'][bookType];
                for (var j = 0; j < booksList.length; j++) {
                    var book = booksList[j];
                    html += '<li>';
                    html += '<a href="#/book/' + book.id + '">' + book.name_cn + '</a>';
                    html += '</li>';
                }
                
                html += '</ul>';
                html += '</div>';
            }
            
            html += '</div>';
        }
        
        // 渲染旧约
        if (testaments['旧约'] && Object.keys(testaments['旧约']).length > 0) {
            html += '<div class="testament-section">';
            html += '<h2 class="testament-title">旧约</h2>';
            
            for (var bookType in testaments['旧约']) {
                html += '<div class="book-type-section">';
                html += '<h3 class="book-type-title">' + bookType + '</h3>';
                html += '<ul class="book-list">';
                
                var booksList = testaments['旧约'][bookType];
                for (var j = 0; j < booksList.length; j++) {
                    var book = booksList[j];
                    html += '<li>';
                    html += '<a href="#/book/' + book.id + '">' + book.name_cn + '</a>';
                    html += '</li>';
                }
                
                html += '</ul>';
                html += '</div>';
            }
            
            html += '</div>';
        }
        
        html += '<div class="nav-links" style="margin-top: 30px;">';
        html += '<a href="/admin">⚙️ 管理后台</a>';
        html += '</div>';
        html += '</div>';
        
        return html;
    }
    
    /**
     * 渲染章节列表
     */
    function renderChapterList(chapters, bookId) {
        if (!chapters || chapters.length === 0) {
            return '<div class="container"><p>没有找到章节</p><a href="#/">返回首页</a></div>';
        }
        
        var bookName = chapters[0].book_name || '书卷';
        
        var html = '<div class="container">';
        html += '<h1>' + bookName + '</h1>';
        html += '<h2>章节列表</h2>';
        html += '<ul class="chapter-list">';
        
        for (var i = 0; i < chapters.length; i++) {
            var chapter = chapters[i];
            html += '<li>';
            html += '<a href="#/book/' + bookId + '/chapter/' + chapter.chapter + '">';
            html += '第 ' + chapter.chapter + ' 章';
            html += '</a>';
            html += '</li>';
        }
        
        html += '</ul>';
        html += '<div class="nav-links">';
        html += '<a href="#/">← 返回书卷列表</a>';
        html += '</div>';
        html += '</div>';
        
        return html;
    }
    
    /**
     * 渲染经文内容
     */
    function renderVerses(verses, bookId, chapter, navigation) {
        if (!verses || verses.length === 0) {
            return '<div class="container"><p>没有找到经文</p><a href="#/">返回首页</a></div>';
        }
        
        var bookName = verses[0].book_name || '书卷';
        
        var html = '<div class="container">';
        html += '<h1>' + bookName + ' 第 ' + chapter + ' 章</h1>';
        html += '<div class="verses">';
        
        for (var i = 0; i < verses.length; i++) {
            var verse = verses[i];
            // API 返回的字段是 verse_ref 和 text
            html += '<div class="verse" id="verse-' + verse.verse_ref + '">';
            html += '<span class="verse-number">' + verse.verse_ref + '</span> ';
            html += '<span class="verse-text">' + verse.text + '</span>';
            html += '</div>';
        }
        
        html += '</div>';
        
        // 导航链接
        html += '<div class="nav-links">';
        
        // 上一章（支持跨卷）
        if (navigation && navigation.prev) {
            var prevLink = '#/book/' + navigation.prev.bookId + '/chapter/' + navigation.prev.chapter;
            var prevText = navigation.prev.bookId === bookId ? '← 上一章' : '← ' + navigation.prev.bookName + ' ' + navigation.prev.chapter;
            html += '<a href="' + prevLink + '">' + prevText + '</a>';
        }
        
        html += '<a href="#/book/' + bookId + '">章节列表</a>';
        html += '<a href="#/">书卷列表</a>';
        
        // 下一章（支持跨卷）
        if (navigation && navigation.next) {
            var nextLink = '#/book/' + navigation.next.bookId + '/chapter/' + navigation.next.chapter;
            var nextText = navigation.next.bookId === bookId ? '下一章 →' : navigation.next.bookName + ' ' + navigation.next.chapter + ' →';
            html += '<a href="' + nextLink + '">' + nextText + '</a>';
        }
        
        html += '</div>';
        html += '</div>';
        
        return html;
    }
    
    /**
     * 路由处理
     */
    function handleRoute() {
        // 检查是否直接访问了服务器路径（没有 Hash）
        var serverPath = window.location.pathname;
        if (serverPath !== '/' && !window.location.hash) {
            // 显示 404 提示
            var container = document.getElementById('app-container');
            if (container) {
                container.innerHTML = 
                    '<div class="container">' +
                    '<h1>⚠️ 页面不存在</h1>' +
                    '<p>您访问的地址 <code>' + serverPath + '</code> 不存在</p>' +
                    '<p>本站使用 Hash 路由，正确的 URL 格式应为：</p>' +
                    '<ul style="text-align: left; max-width: 400px; margin: 20px auto;">' +
                    '<li><code>#/</code> - 书卷列表</li>' +
                    '<li><code>#/book/1</code> - 查看书卷</li>' +
                    '<li><code>#/book/1/chapter/1</code> - 查看章节</li>' +
                    '</ul>' +
                    '<a href="#/" class="button" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background: #3498db; color: white; text-decoration: none; border-radius: 4px;">返回首页</a>' +
                    '</div>';
            }
            return;
        }
        
        var hash = window.location.hash || '#/';
        var path = hash.substring(1); // 去掉 #
        
        // 避免重复加载
        if (appState.currentRoute === path && !appState.loading) {
            return;
        }
        
        appState.currentRoute = path;
        var container = document.getElementById('app-container');
        
        if (!container) {
            return;
        }
        
        toggleLoading(true);
        
        // 解析路由
        var parts = path.split('/').filter(function(p) { return p; });
        
        // 首页 - 书卷列表
        if (parts.length === 0) {
            ajaxGet('/api/books', function(err, response) {
                toggleLoading(false);
                if (err) {
                    showError('加载书卷列表失败');
                    container.innerHTML = '<div class="container"><p>加载失败，请刷新重试</p></div>';
                    return;
                }
                container.innerHTML = renderBookList(response.data);
            });
        }
        // 章节列表
        else if (parts.length === 2 && parts[0] === 'book') {
            var bookId = parts[1];
            ajaxGet('/api/book/' + bookId, function(err, response) {
                toggleLoading(false);
                if (err) {
                    showError('加载章节列表失败');
                    container.innerHTML = '<div class="container"><p>加载失败，请刷新重试</p></div>';
                    return;
                }
                container.innerHTML = renderChapterList(response.data, bookId);
            });
        }
        // 经文内容
        else if (parts.length === 4 && parts[0] === 'book' && parts[2] === 'chapter') {
            var bookId = parts[1];
            var chapter = parts[3];
            
            // 同时获取经文和导航信息
            var versesLoaded = false;
            var navLoaded = false;
            var versesData = null;
            var navData = null;
            
            function checkComplete() {
                if (versesLoaded && navLoaded) {
                    toggleLoading(false);
                    if (versesData && navData) {
                        container.innerHTML = renderVerses(versesData, bookId, parseInt(chapter), navData);
                        window.scrollTo(0, 0);
                    } else {
                        container.innerHTML = '<div class="container"><p>加载失败，请刷新重试</p></div>';
                    }
                }
            }
            
            ajaxGet('/api/verses?bookId=' + bookId + '&chapter=' + chapter, function(err, response) {
                versesLoaded = true;
                if (!err && response) {
                    versesData = response.data;
                }
                checkComplete();
            });
            
            ajaxGet('/api/navigation?bookId=' + bookId + '&chapter=' + chapter, function(err, response) {
                navLoaded = true;
                if (!err && response) {
                    navData = response.data;
                }
                checkComplete();
            });
        }
        // 404
        else {
            toggleLoading(false);
            container.innerHTML = '<div class="container"><h1>404</h1><p>页面不存在</p><a href="#/">返回首页</a></div>';
        }
    }
    
    /**
     * 初始化路由
     */
    function initRouter() {
        // 监听 hash 变化
        if ('onhashchange' in window) {
            window.addEventListener('hashchange', handleRoute);
        } else {
            // 旧浏览器使用轮询
            var lastHash = window.location.hash;
            setInterval(function() {
                if (window.location.hash !== lastHash) {
                    lastHash = window.location.hash;
                    handleRoute();
                }
            }, 100);
        }
        
        // 初始加载
        handleRoute();
    }
    
    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initRouter);
    } else {
        initRouter();
    }
    
})();
