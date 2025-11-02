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
            // 使用 setTimeout 确保异步调用，避免同步回调
            setTimeout(function() {
                callback(null, appState.cache[url]);
            }, 0);
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
     * 预读上一章和下一章（提升用户体验）
     */
    function preloadChapters(navigation) {
        if (!navigation) {
            return;
        }
        
        // 预读上一章
        if (navigation.prev) {
            var prevVersesUrl = '/api/verses?bookId=' + navigation.prev.bookId + '&chapter=' + navigation.prev.chapter;
            var prevNavUrl = '/api/navigation?bookId=' + navigation.prev.bookId + '&chapter=' + navigation.prev.chapter;
            
            ajaxGet(prevVersesUrl, function(err) {
                if (!err) {
                    // 同时预读导航数据
                    ajaxGet(prevNavUrl, function() {
                        // 预读完成
                    });
                }
            });
        }
        
        // 预读下一章
        if (navigation.next) {
            var nextVersesUrl = '/api/verses?bookId=' + navigation.next.bookId + '&chapter=' + navigation.next.chapter;
            var nextNavUrl = '/api/navigation?bookId=' + navigation.next.bookId + '&chapter=' + navigation.next.chapter;
            
            ajaxGet(nextVersesUrl, function(err) {
                if (!err) {
                    // 同时预读导航数据
                    ajaxGet(nextNavUrl, function() {
                        // 预读完成
                    });
                }
            });
        }
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
        
        // 面包屑导航
        html += '<div class="breadcrumb">';
        html += '<a href="#/">首页</a>';
        html += ' / ';
        html += '<span>' + bookName + '</span>';
        html += '</div>';
        
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
        html += '<a href="#/">返回首页</a>';
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
        
        var html = '<div class="container verse-page-container">';
        html += '<h1>' + bookName + ' 第 ' + chapter + ' 章</h1>';
        
        // 面包屑导航
        html += '<div class="breadcrumb">';
        html += '<a href="#/">首页</a>';
        html += ' / ';
        html += '<a href="#/book/' + bookId + '">' + bookName + '</a>';
        html += ' / ';
        html += '<span>第 ' + chapter + ' 章</span>';
        html += '</div>';
        
        // 顶部导航（去掉返回首页）
        html += '<div class="nav-links top-nav">';
        
        // 上一章（始终显示）
        if (navigation && navigation.prev) {
            var prevLink = '#/book/' + navigation.prev.bookId + '/chapter/' + navigation.prev.chapter;
            html += '<a href="' + prevLink + '">上一章</a>';
        } else {
            html += '<a class="disabled">上一章</a>';
        }
        
        // 下一章（始终显示）
        if (navigation && navigation.next) {
            var nextLink = '#/book/' + navigation.next.bookId + '/chapter/' + navigation.next.chapter;
            html += '<a href="' + nextLink + '">下一章</a>';
        } else {
            html += '<a class="disabled">下一章</a>';
        }
        
        html += '</div>';
        
        // 经文内容
        html += '<div class="verses">';
        
        for (var i = 0; i < verses.length; i++) {
            var verse = verses[i];
            // API 返回的字段是 verse_ref 和 text
            html += '<div class="verse" id="verse-' + (verse.verse_ref || i) + '">';
            // 只有当 verse_ref 存在且不为 null 时才显示节号
            if (verse.verse_ref && verse.verse_ref !== 'null') {
                html += '<span class="verse-number">' + verse.verse_ref + '</span> ';
            }
            html += '<span class="verse-text">' + verse.text + '</span>';
            html += '</div>';
        }
        
        html += '</div>';
        
        // AI 辅助功能区（固定在底部）
        html += '<div class="ai-features-fixed">';
        html += '<div id="ai-result" class="ai-result" style="display: none;">';
        html += '<button id="ai-result-close" class="ai-close-btn">✕</button>';
        html += '<div class="ai-result-header">';
        html += '<h3 id="ai-result-title"></h3>';
        html += '</div>';
        html += '<div id="ai-result-content" class="ai-result-content"></div>';
        html += '<div id="ai-result-loading" class="ai-loading" style="display: none;">';
        html += '<div class="spinner"></div>';
        html += '<p>正在生成内容...</p>';
        html += '</div>';
        html += '<div id="ai-result-error" class="ai-error" style="display: none;"></div>';
        html += '</div>';
        html += '<div class="ai-buttons">';
        html += '<button class="ai-btn" data-function="summary" data-book-id="' + bookId + '" data-chapter="' + chapter + '">经文总结</button>';
        html += '<button class="ai-btn" data-function="history" data-book-id="' + bookId + '" data-chapter="' + chapter + '">历史背景</button>';
        html += '<button class="ai-btn" data-function="saints" data-book-id="' + bookId + '" data-chapter="' + chapter + '">圣人诠释</button>';
        html += '<button class="ai-btn" data-function="prayer" data-book-id="' + bookId + '" data-chapter="' + chapter + '">祈祷指引</button>';
        html += '</div>';
        html += '</div>';
        
        // 底部导航（完整版）
        html += '<div class="nav-links">';
        
        // 上一章（始终显示）
        if (navigation && navigation.prev) {
            var prevLink = '#/book/' + navigation.prev.bookId + '/chapter/' + navigation.prev.chapter;
            html += '<a href="' + prevLink + '">上一章</a>';
        } else {
            html += '<a class="disabled">上一章</a>';
        }
        
        html += '<a href="#/">返回首页</a>';
        html += '<a href="#/book/' + bookId + '">章节列表</a>';
        
        // 下一章（始终显示）
        if (navigation && navigation.next) {
            var nextLink = '#/book/' + navigation.next.bookId + '/chapter/' + navigation.next.chapter;
            html += '<a href="' + nextLink + '">下一章</a>';
        } else {
            html += '<a class="disabled">下一章</a>';
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
                        
                        // 绑定 AI 按钮事件
                        initAIButtons();
                        
                        // 页面渲染完成后预读上一章和下一章
                        setTimeout(function() {
                            preloadChapters(navData);
                        }, 100);
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
        
        // 添加全局键盘事件
        document.addEventListener('keydown', function(e) {
            var hash = window.location.hash;
            
            // ESC 键关闭 AI 内容区
            if (e.keyCode === 27 || e.key === 'Escape') {
                var aiResult = document.getElementById('ai-result');
                if (aiResult && aiResult.style.display !== 'none') {
                    aiResult.style.display = 'none';
                    e.preventDefault();
                }
            }
            
            // 左右方向键切换章节（仅在章节页面）
            if (hash.indexOf('#/book/') === 0) {
                var match = hash.match(/#\/book\/(\d+)\/chapter\/(\d+)/);
                if (match) {
                    // 左键：上一章
                    if (e.keyCode === 37 || e.key === 'ArrowLeft') {
                        var navLinks = document.querySelectorAll('.nav-links a');
                        for (var i = 0; i < navLinks.length; i++) {
                            if (navLinks[i].textContent === '上一章' && !navLinks[i].classList.contains('disabled')) {
                                e.preventDefault();
                                window.location.hash = navLinks[i].getAttribute('href');
                                break;
                            }
                        }
                    }
                    // 右键：下一章
                    else if (e.keyCode === 39 || e.key === 'ArrowRight') {
                        var navLinks = document.querySelectorAll('.nav-links a');
                        for (var i = 0; i < navLinks.length; i++) {
                            if (navLinks[i].textContent === '下一章' && !navLinks[i].classList.contains('disabled')) {
                                e.preventDefault();
                                window.location.hash = navLinks[i].getAttribute('href');
                                break;
                            }
                        }
                    }
                }
            }
        });
    }
    
    /**
     * 初始化 AI 按钮事件
     */
    function initAIButtons() {
        var aiButtons = document.querySelectorAll('.ai-btn');
        var resultBox = document.getElementById('ai-result');
        var resultTitle = document.getElementById('ai-result-title');
        var resultContent = document.getElementById('ai-result-content');
        var resultLoading = document.getElementById('ai-result-loading');
        var resultError = document.getElementById('ai-result-error');
        var closeBtn = document.getElementById('ai-result-close');
        
        if (!resultBox) return;
        
        var functionNames = {
            'summary': '📋 经文总结',
            'history': '📜 历史背景',
            'saints': '👼 圣人诠释',
            'prayer': '🙏 祈祷指引'
        };
        
        // 当前激活的按钮
        var activeButton = null;
        
        // 当前显示的 AI 内容信息
        var currentAIInfo = {
            functionType: null,
            bookId: null,
            chapter: null
        };
        
        // 内容缓存（内存缓存，刷新页面会丢失）
        var contentCache = {};
        
        // 重新生成 AI 内容（全局函数，供按钮调用）
        window.regenerateAIContent = function() {
            if (!currentAIInfo.functionType || !currentAIInfo.bookId || !currentAIInfo.chapter) {
                showError('无法重新生成：缺少必要信息');
                return;
            }
            
            // 清除缓存
            var cacheKey = currentAIInfo.bookId + '-' + currentAIInfo.chapter + '-' + currentAIInfo.functionType;
            delete contentCache[cacheKey];
            
            // 强制重新生成
            requestAI(currentAIInfo.functionType, currentAIInfo.bookId, currentAIInfo.chapter, cacheKey, true);
        };
        
        // 关闭结果框
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                resultBox.style.display = 'none';
                // 移除激活状态
                var buttons = document.querySelectorAll('.ai-btn');
                for (var k = 0; k < buttons.length; k++) {
                    buttons[k].classList.remove('active');
                }
                activeButton = null;
            });
        }
        
        // 为每个按钮绑定点击事件
        for (var i = 0; i < aiButtons.length; i++) {
            aiButtons[i].addEventListener('click', function() {
                var functionType = this.getAttribute('data-function');
                var bookId = this.getAttribute('data-book-id');
                var chapter = this.getAttribute('data-chapter');
                
                // 如果点击的是当前激活按钮，关闭结果框
                if (this === activeButton && resultBox.style.display !== 'none') {
                    resultBox.style.display = 'none';
                    this.classList.remove('active');
                    activeButton = null;
                } else {
                    // 否则请求 AI 生成（或从缓存读取）
                    // 移除其他按钮的激活状态
                    for (var j = 0; j < aiButtons.length; j++) {
                        aiButtons[j].classList.remove('active');
                    }
                    // 激活当前按钮
                    this.classList.add('active');
                    activeButton = this;
                    
                    // 保存当前信息（用于重新生成）
                    currentAIInfo.functionType = functionType;
                    currentAIInfo.bookId = bookId;
                    currentAIInfo.chapter = chapter;
                    
                    // 生成缓存键
                    var cacheKey = bookId + '-' + chapter + '-' + functionType;
                    
                    // 检查缓存
                    if (contentCache[cacheKey]) {
                        // 从缓存读取（秒开）
                        showCachedContent(functionType, contentCache[cacheKey]);
                    } else {
                        // 请求 AI 生成
                        requestAI(functionType, bookId, chapter, cacheKey, false);
                    }
                }
            });
        }
        
        function showCachedContent(functionType, content) {
            // 显示缓存内容（秒开）
            resultBox.style.display = 'block';
            resultTitle.textContent = functionNames[functionType];
            resultContent.innerHTML = formatAIResponse(content);
            resultContent.style.display = 'block';
            resultError.style.display = 'none';
            resultLoading.style.display = 'none';
            
            // 绑定引用链接的点击事件，阻止路由跳转
            bindCitationLinks();
        }
        
        function requestAI(functionType, bookId, chapter, cacheKey, forceRegenerate) {
            // 显示结果框和加载状态
            resultBox.style.display = 'block';
            resultTitle.textContent = functionNames[functionType] + (forceRegenerate ? ' (重新生成中...)' : '');
            resultContent.style.display = 'none';
            resultError.style.display = 'none';
            resultLoading.style.display = 'block';
            
            // 使用流式响应（Server-Sent Events）
            var url = '/api/ai/generate-stream?function_type=' + encodeURIComponent(functionType) +
                      '&book_id=' + encodeURIComponent(bookId) +
                      '&chapter=' + encodeURIComponent(chapter) +
                      '&lang=zh' +
                      '&force_regenerate=' + (forceRegenerate ? 'true' : 'false');
            
            // 检查浏览器是否支持 EventSource
            if (typeof EventSource === 'undefined') {
                // 降级到非流式请求
                fallbackToNonStreaming(functionType, bookId, chapter, cacheKey, forceRegenerate);
                return;
            }
            
            var eventSource = new EventSource(url);
            var accumulatedContent = '';
            var citations = [];
            var contentReceived = false;
            
            eventSource.onmessage = function(event) {
                try {
                    var data = JSON.parse(event.data);
                    
                    if (data.type === 'connected') {
                        // 收到连接确认，隐藏加载动画，显示"正在连接"
                        resultLoading.style.display = 'none';
                        resultContent.style.display = 'block';
                        resultContent.innerHTML = '<p style="color: #666; font-style: italic;">⚡ 已连接，等待响应...</p>';
                        
                    } else if (data.type === 'connecting') {
                        // API 连接中
                        resultContent.innerHTML = '<p style="color: #666; font-style: italic;">🔄 ' + data.message + '</p>';
                        
                    } else if (data.type === 'heartbeat') {
                        // 心跳消息 - 让用户知道系统还在工作
                        var elapsed = data.elapsed || 0;
                        var dots = '.'.repeat((elapsed / 3) % 4);
                        resultContent.innerHTML = '<p style="color: #666; font-style: italic;">⏳ ' + data.message + dots + '</p>' +
                                                '<p style="color: #999; font-size: 0.85rem; margin-top: 0.5rem;">已等待 ' + elapsed + ' 秒</p>';
                        
                    } else if (data.type === 'chunk') {
                        // 接收到内容片段
                        accumulatedContent += data.content;
                        
                        // 首次收到内容时，隐藏加载/心跳提示，直接显示内容
                        if (!contentReceived) {
                            contentReceived = true;
                            resultLoading.style.display = 'none';
                            resultContent.style.display = 'block';
                        }
                        
                        // 直接实时渲染累积的内容（无打字机效果）
                        resultContent.innerHTML = formatAIResponse({
                            content: accumulatedContent,
                            citations: []
                        });
                        
                        // 自动滚动到底部
                        resultContent.scrollTop = resultContent.scrollHeight;
                        
                    } else if (data.type === 'done') {
                        // 生成完成
                        citations = data.citations || [];
                        
                        // 保存完整响应到缓存
                        var fullData = {
                            content: accumulatedContent,
                            citations: citations
                        };
                        contentCache[cacheKey] = fullData;
                        
                        // 最终渲染（包含引用列表）
                        resultContent.innerHTML = formatAIResponse(fullData);
                        resultContent.style.display = 'block';
                        
                        // 绑定引用链接
                        bindCitationLinks();
                        
                        // 关闭连接
                        eventSource.close();
                        
                        // 更新标题（移除"生成中"提示）
                        if (data.cached) {
                            resultTitle.textContent = functionNames[functionType] + ' (已缓存)';
                        } else {
                            resultTitle.textContent = functionNames[functionType];
                        }
                        
                    } else if (data.type === 'error') {
                        // 错误处理
                        showError(data.message || 'AI 生成失败');
                        eventSource.close();
                    }
                } catch (e) {
                    showError('解析响应失败：' + e.message);
                    eventSource.close();
                }
            };
            
            eventSource.onerror = function(err) {
                resultLoading.style.display = 'none';
                showError('连接中断，请重试');
                eventSource.close();
            };
        }
        
        // 降级方案：不支持 EventSource 时使用原有的 POST 请求
        function fallbackToNonStreaming(functionType, bookId, chapter, cacheKey, forceRegenerate) {
            var xhr = new XMLHttpRequest();
            xhr.open('POST', '/api/ai/generate', true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    resultLoading.style.display = 'none';
                    
                    if (xhr.status === 200) {
                        try {
                            var data = JSON.parse(xhr.responseText);
                            if (data.success && data.data && data.data.content) {
                                contentCache[cacheKey] = data.data;
                                resultContent.innerHTML = formatAIResponse(data.data);
                                resultContent.style.display = 'block';
                                bindCitationLinks();
                            } else {
                                showError(data.message || '生成失败');
                            }
                        } catch (e) {
                            showError('解析响应失败：' + e.message);
                        }
                    } else {
                        var errorMsg = '请求失败（' + xhr.status + '）';
                        try {
                            var errorData = JSON.parse(xhr.responseText);
                            errorMsg = errorData.message || errorMsg;
                        } catch (e) {}
                        showError(errorMsg);
                    }
                }
            };
            
            xhr.onerror = function() {
                resultLoading.style.display = 'none';
                showError('网络错误，请检查连接');
            };
            
            xhr.send(JSON.stringify({
                function_type: functionType,
                book_id: parseInt(bookId),
                chapter: parseInt(chapter),
                lang: 'zh',
                force_regenerate: forceRegenerate === true
            }));
        }
        
        function showError(message) {
            resultError.textContent = '❌ ' + message;
            resultError.style.display = 'block';
        }
        
        function bindCitationLinks() {
            // 绑定引用链接，阻止 hash 路由跳转，使用平滑滚动
            var refLinks = resultContent.querySelectorAll('a[href^="#ref-"], a[href^="#refback-"]');
            for (var i = 0; i < refLinks.length; i++) {
                refLinks[i].addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    var targetId = this.getAttribute('href').substring(1); // 移除 #
                    var targetEl = document.getElementById(targetId);
                    
                    if (targetEl) {
                        // 在 AI 结果区内平滑滚动
                        targetEl.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'start' 
                        });
                    }
                });
            }
        }
        
        function formatAIResponse(data) {
            var html = '';
            
            // 兼容旧格式（字符串）和新格式（对象）
            var content = typeof data === 'string' ? data : data.content;
            var citations = (typeof data === 'object' && data.citations) ? data.citations : [];
            
            // 使用 marked.js 解析 Markdown
            if (typeof marked !== 'undefined') {
                try {
                    marked.setOptions({
                        breaks: true,
                        gfm: true,
                        headerIds: false,
                        mangle: false
                    });
                    
                    // 解析主要内容
                    html = marked.parse(content);
                    
                    // 处理引用上标 [^1] -> <sup><a>
                    html = html.replace(/\[\^(\d+)\]/g, function(match, num) {
                        return '<sup class="ref-link"><a href="#ref-' + num + '" id="refback-' + num + '">[' + num + ']</a></sup>';
                    });
                    
                    // 如果有 citations 数组，生成引用列表
                    if (citations && citations.length > 0) {
                        html += '<div class="references"><h4>📚 引用资料</h4><ol>';
                        for (var i = 0; i < citations.length; i++) {
                            var citation = citations[i];
                            var refNum = i + 1;
                            var refText = '';
                            
                            // 构建引用文本
                            if (citation.document_title) {
                                refText += '<strong>' + citation.document_title + '</strong>';
                            }
                            if (citation.document_reference) {
                                refText += ' ' + citation.document_reference;
                            }
                            if (citation.document_author) {
                                refText += ' - ' + citation.document_author;
                            }
                            if (citation.document_year && citation.document_year !== '0') {
                                refText += ' (' + citation.document_year + ')';
                            }
                            if (citation.source_url) {
                                refText += ' <a href="' + citation.source_url + '" target="_blank" rel="noopener" class="source-link">🔗 原文链接</a>';
                            }
                            
                            html += '<li id="ref-' + refNum + '">' + refText + '</li>';
                        }
                        html += '</ol></div>';
                        
                        // 添加重新生成按钮
                        html += '<div class="ai-regenerate-container">';
                        html += '<button class="ai-regenerate-btn" onclick="regenerateAIContent()">重新生成新回答</button>';
                        html += '</div>';
                    }
                    
                    return html;
                } catch (e) {
                    console.error('Markdown 解析失败:', e);
                    return '<p>' + content.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>') + '</p>';
                }
            } else {
                console.warn('marked.js 未加载，使用简单格式化');
                return '<p>' + content.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>') + '</p>';
            }
        }
    }
    
    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initRouter);
    } else {
        initRouter();
    }
    
})();
