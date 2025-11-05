/**
 * 前端路由系统
 * Hash 路由实现，ES5 语法兼容旧浏览器
 */

(function() {
    'use strict';
    
    // 全局状态
    var appState = {
        currentRoute: null,
        loading: false,
        cache: {},
        scrollToVerse: null, // 用于保存需要滚动到的经文引用
        allBooks: [] // 存储所有书卷列表，用于实时搜索提示
    };

    /**
     * 渲染页面头部：左侧标题 + 右侧设置按钮（蓝线在下方）
     */
    function renderHeader(title) {
        var html = '';
        html += '<div class="page-header">';
        html += '<h1>' + title + '</h1>';
        html += '<div class="font-size-selector">';
        html += '  <button class="font-size-button" id="settings-toggle" aria-label="设置">⚙️</button>';
        html += '  <div class="font-size-options" id="settings-options">';
        html += '    <div class="settings-header">字号</div>';
        html += '    <button data-action="font-size" data-size="14">小</button>';
        html += '    <button data-action="font-size" data-size="18" class="active">默认</button>';
        html += '    <button data-action="font-size" data-size="22">大</button>';
        html += '    <div class="settings-header">显示模式</div>';
        html += '    <button data-action="theme" data-theme="light" class="active">日间模式</button>';
        html += '    <button data-action="theme" data-theme="dark">夜间模式</button>';
        html += '  </div>';
        html += '</div>';
        html += '</div>';
        return html;
    }
    
    /**
     * 渲染继续/最近阅读卡片（同步，避免闪烁）
     */
    function renderReadingCards() {
        var progress = null;
        var history = [];
        
        try {
            var progressData = localStorage.getItem('sigao_reading_progress');
            if (progressData) {
                progress = JSON.parse(progressData);
            }
            var historyData = localStorage.getItem('sigao_reading_history');
            if (historyData) {
                history = JSON.parse(historyData);
            }
        } catch (e) {
            // localStorage 不可用时使用空数据
        }
        
        var html = '<div class="reading-cards-container">';
        
        // 继续阅读卡片
        var hasValidProgress = false;
        var continueText = '无';
        var continuePath = '';
        
        if (progress && progress.timestamp) {
            var now = new Date().getTime();
            var daysPassed = (now - progress.timestamp) / (1000 * 60 * 60 * 24);
            if (daysPassed <= 30 && progress.bookName && progress.chapter) {
                hasValidProgress = true;
                continueText = (progress.bookName || '未知书卷') + ' 第 ' + progress.chapter + ' 章';
                continuePath = progress.path || '';
            }
        }
        
        html += '<div class="continue-reading-card' + (hasValidProgress ? '' : ' is-disabled') + '"';
        if (hasValidProgress) {
            html += ' data-path="' + continuePath + '"';
        }
        html += '>';
        html += '<div class="continue-reading-content">';
        html += '<h3 class="continue-reading-title">📖 继续阅读</h3>';
        html += '<p class="continue-reading-info">' + continueText + '</p>';
        html += '</div></div>';
        
        // 最近阅读卡片
        var count = history && history.length ? history.length : 0;
        var recentText = count > 0 ? (count + ' 条记录') : '无';
        
        html += '<div class="recent-reading-card' + (count > 0 ? '' : ' is-disabled') + '">';
        html += '<div class="recent-reading-content">';
        html += '<h3 class="recent-reading-title">📚 最近阅读</h3>';
        html += '<p class="recent-reading-info">' + recentText + '</p>';
        html += '</div></div>';
        
        html += '</div>';
        
        return html;
    }
    
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
     * 触发路由变化事件（供其他模块监听）
     */
    function triggerRouteChanged() {
        // 使用 CustomEvent（旧浏览器兼容处理）
        var event;
        if (typeof window.CustomEvent === 'function') {
            event = new CustomEvent('routeChanged', { detail: { route: appState.currentRoute } });
        } else {
            // IE 9-11 兼容
            event = document.createEvent('CustomEvent');
            event.initCustomEvent('routeChanged', false, false, { route: appState.currentRoute });
        }
        document.dispatchEvent(event);
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
     * 绑定继续/最近阅读卡片的点击事件
     * 只为启用的卡片(非 .is-disabled)绑定事件
     */
    function bindReadingCardsEvents() {
        // 绑定继续阅读卡片
        var continueCard = document.querySelector('.continue-reading-card');
        if (continueCard && !continueCard.classList.contains('is-disabled')) {
            continueCard.addEventListener('click', function() {
                var path = continueCard.getAttribute('data-path');
                if (path) {
                    window.location.hash = path;
                }
            });
        }
        
        // 绑定最近阅读卡片
        var recentCard = document.querySelector('.recent-reading-card');
        if (recentCard && !recentCard.classList.contains('is-disabled')) {
            recentCard.addEventListener('click', function() {
                window.location.hash = '#/recent-reading';
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
    html += renderHeader('📖 思高小助手');
        
        // 继续/最近阅读卡片（同步渲染，避免闪烁）
        html += renderReadingCards();
        
        // 添加搜索框
        html += '<div class="search-container">';
        html += '<div class="search-box">';
        html += '<input type="text" id="search-input" class="search-input" placeholder="搜索经文或书卷名..." aria-label="搜索" autocomplete="off">';
        html += '<button id="search-btn" class="search-btn">搜索</button>';
        html += '</div>';
        html += '<div id="search-suggestions" class="search-suggestions" style="display: none;"></div>';
        html += '</div>';
        
        // 渲染新约（可折叠，默认展开）
        if (testaments['新约'] && Object.keys(testaments['新约']).length > 0) {
            html += '<div class="testament-section">';
            // 使用可点击的 button 控制折叠，保留原有样式外观
            html += '<h2 class="testament-title"><button class="testament-toggle" aria-expanded="true" data-testament="新约">新约 <span class="caret">▾</span></button></h2>';
            html += '<div class="testament-content" data-testament="新约">';

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

            html += '</div>'; // testament-content
            html += '</div>';
        }
        
        // 渲染旧约（可折叠，默认展开）
        if (testaments['旧约'] && Object.keys(testaments['旧约']).length > 0) {
            html += '<div class="testament-section">';
            html += '<h2 class="testament-title"><button class="testament-toggle" aria-expanded="true" data-testament="旧约">旧约 <span class="caret">▾</span></button></h2>';
            html += '<div class="testament-content" data-testament="旧约">';

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

            html += '</div>'; // testament-content
            html += '</div>';
        }
        
        html += '</div>';
        
        return html;
    }

    /**
     * 初始化 新约/旧约 折叠开关
     * 默认展开，支持无障碍 aria-expanded
     */
    function initTestamentToggles() {
        try {
            var toggles = document.querySelectorAll('.testament-toggle');
            for (var i = 0; i < toggles.length; i++) {
                (function(btn) {
                    // 查找对应内容区域
                    var testament = btn.getAttribute('data-testament');
                    var content = document.querySelector('.testament-content[data-testament="' + testament + '"]');

                    // 确保内容有过渡准备
                    if (content) {
                        content.style.overflow = 'hidden';
                        content.style.transition = 'max-height 0.25s ease';
                        // 默认展开：设置合适的 max-height
                        try {
                            content.style.maxHeight = content.scrollHeight + 'px';
                        } catch (e) {
                            content.style.maxHeight = 'none';
                        }
                    }

                    // 点击切换
                    btn.addEventListener('click', function() {
                        var expanded = btn.getAttribute('aria-expanded') === 'true';
                        if (!content) return;

                        // 找到父级 testament-section（兼容旧浏览器）
                        var section = btn.parentNode;
                        while (section && section.nodeType === 1 && section.className.indexOf('testament-section') === -1) {
                            section = section.parentNode;
                        }

                        // 清理之前可能残留的 transitionend 监听器
                        var onTransitionEnd = function() {};

                        if (expanded) {
                            // 折叠：从当前高度平滑过渡到 0
                            btn.setAttribute('aria-expanded', 'false');
                            var caret = btn.querySelector('.caret'); if (caret) caret.textContent = '▸';

                            try {
                                // 确保起始 maxHeight 为当前实际高度（像素），避免 jump
                                content.style.maxHeight = content.scrollHeight + 'px';
                            } catch (e) {
                                content.style.maxHeight = '0px';
                            }

                            // 强制回流，确保浏览器应用上面的 maxHeight
                            content.offsetHeight;

                            // 在 transition 结束后添加 collapsed 类（这样不会影响动画进行中的布局）
                            onTransitionEnd = function(ev) {
                                if (ev && ev.propertyName !== 'max-height') return;
                                try { if (section && section.classList) section.classList.add('collapsed'); } catch (e) {}
                                content.removeEventListener('transitionend', onTransitionEnd);
                            };
                            content.addEventListener('transitionend', onTransitionEnd);

                            // 然后触发折叠动画
                            content.style.maxHeight = '0px';
                        } else {
                            // 展开：立即移除 collapsed 类，计算内容高度并展开
                            btn.setAttribute('aria-expanded', 'true');
                            var caret = btn.querySelector('.caret'); if (caret) caret.textContent = '▾';

                            try { if (section && section.classList) section.classList.remove('collapsed'); } catch (e) {}

                            // 先把 maxHeight 设为 0（在某些浏览器中需要），然后强制回流后再设为 scrollHeight
                            content.style.maxHeight = '0px';
                            content.offsetHeight; // 强制回流
                            content.style.maxHeight = content.scrollHeight + 'px';

                            // 可选：在展开完成后移除 maxHeight 限制以支持内容内部动态变化
                            onTransitionEnd = function(ev) {
                                if (ev && ev.propertyName !== 'max-height') return;
                                try {
                                    // 允许高度自适应
                                    content.style.maxHeight = '';
                                } catch (e) {}
                                content.removeEventListener('transitionend', onTransitionEnd);
                            };
                            content.addEventListener('transitionend', onTransitionEnd);
                        }
                    });
                })(toggles[i]);
            }
        } catch (e) {
            // 安全降级：不影响主逻辑
            console.log('initTestamentToggles error', e);
        }
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
    html += renderHeader(bookName);
        
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
    html += renderHeader(bookName + ' 第 ' + chapter + ' 章');
        
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
        
        //智能辅助功能区（固定在底部）
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
     * 渲染搜索结果
     */
    function renderSearchResults(results, keyword) {
    var html = '<div class="container">';
    html += renderHeader('🔍 搜索结果');
        
        // 面包屑导航
        html += '<div class="breadcrumb">';
        html += '<a href="#/">首页</a>';
        html += ' / ';
        html += '<span>搜索结果</span>';
        html += '</div>';
        
        // 搜索框
        html += '<div class="search-container">';
        html += '<div class="search-box">';
        html += '<input type="text" id="search-input" class="search-input" placeholder="搜索经文或书卷名..." value="' + (keyword || '').replace(/"/g, '&quot;') + '" aria-label="搜索" autocomplete="off">';
        html += '<button id="search-btn" class="search-btn">搜索</button>';
        html += '</div>';
        html += '<div id="search-suggestions" class="search-suggestions" style="display: none;"></div>';
        html += '</div>';
        
        if (!keyword || keyword.trim() === '') {
            html += '<div class="search-results-empty">请输入搜索关键词</div>';
            html += '<div class="nav-links"><a href="#/">返回首页</a></div>';
            html += '</div>';
            return html;
        }
        
        var versesItems = [];
        var versesTotal = 0;
        var versesPage = 1;
        var versesPerPage = 100;
        if (results.verses) {
            if (Array.isArray(results.verses)) {
                // backward compatibility
                versesItems = results.verses;
                versesTotal = results.verses.length;
            } else {
                versesItems = results.verses.items || [];
                versesTotal = results.verses.total || (versesItems ? versesItems.length : 0);
                versesPage = results.verses.page || 1;
                versesPerPage = results.verses.per_page || versesPerPage;
            }
        }

        var hasResults = (results.books && results.books.length > 0) || (versesItems && versesItems.length > 0);
        
        if (!hasResults) {
            html += '<div class="search-results-empty">未找到包含 "' + keyword + '" 的结果</div>';
            html += '<div class="nav-links"><a href="#/">返回首页</a></div>';
            html += '</div>';
            return html;
        }
        
        html += '<div class="search-results">';
        
        // 显示匹配的书卷
        if (results.books && results.books.length > 0) {
            html += '<h3>📚 匹配的书卷 (' + results.books.length + ')</h3>';
            html += '<ul class="search-books-list">';
            for (var i = 0; i < results.books.length; i++) {
                var book = results.books[i];
                html += '<li>';
                html += '<a href="#/book/' + book.id + '">';
                html += book.name_cn;
                if (book.book_type) {
                    html += ' <span style="font-size: 0.85em; opacity: 0.7;">(' + book.book_type + ')</span>';
                }
                html += '</a>';
                html += '</li>';
            }
            html += '</ul>';
        }
        
        // 显示匹配的经文
        if (versesItems && versesItems.length > 0) {
            html += '<h3>📖 匹配的经文 (' + versesTotal + ')</h3>';
            html += '<ul class="search-verses-list">';
            for (var i = 0; i < versesItems.length; i++) {
                var verse = versesItems[i];
                html += '<li data-book-id="' + verse.book_id + '" data-chapter="' + verse.chapter + '" data-verse-ref="' + (verse.verse_ref || '') + '">';
                html += '<div class="search-verse-ref">';
                html += verse.book_name + ' ' + verse.chapter;
                if (verse.verse_ref) {
                    html += ':' + verse.verse_ref;
                }
                html += '</div>';
                html += '<div class="search-verse-text">';
                // 高亮显示关键词
                var text = verse.text || '';
                var highlightedText = highlightKeyword(text, keyword);
                html += highlightedText;
                html += '</div>';
                html += '</li>';
            }
            html += '</ul>';
            // 分页控件
            var totalPages = Math.max(1, Math.ceil(versesTotal / versesPerPage));
            if (totalPages > 1) {
                html += '<div class="search-pagination" aria-label="分页">';
                var prevPage = Math.max(1, versesPage - 1);
                var nextPage = Math.min(totalPages, versesPage + 1);
                var baseQuery = '#/search?q=' + encodeURIComponent(keyword) + '&per_page=' + versesPerPage + '&page=';
                if (versesPage > 1) {
                    html += '<a class="pagination-prev" href="' + baseQuery + prevPage + '">上一页</a>';
                } else {
                    html += '<span class="pagination-disabled">上一页</span>';
                }
                html += '<span class="pagination-info"> 第 ' + versesPage + ' 页 / 共 ' + totalPages + ' 页</span>&nbsp;';
                if (versesPage < totalPages) {
                    html += '<a class="pagination-next" href="' + baseQuery + nextPage + '">下一页</a>';
                } else {
                    html += '<span class="pagination-disabled">下一页</span>';
                }
                html += '</div>';
            }
        }
        
        html += '</div>';
        html += '<div class="nav-links"><a href="#/">返回首页</a></div>';
        html += '</div>';
        
        return html;
    }
    
    /**
     * 高亮显示关键词
     */
    function highlightKeyword(text, keyword) {
        if (!keyword || !text) {
            return text;
        }
        
        // 转义特殊字符
        var escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        var regex = new RegExp('(' + escapedKeyword + ')', 'gi');
        return text.replace(regex, '<span class="highlight">$1</span>');
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
                    renderHeader('⚠️ 页面不存在') +
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
    
        //（已撤销）原先在这里保存当前路由的滚动位置以避免切换时滚动污染，
        //该逻辑已按用户要求移除，故此处不再执行保存操作。

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
        
        // 分离路径和查询参数
        var pathParts = path.split('?');
        var routePath = pathParts[0];
        var queryString = pathParts[1] || '';
        
        // 解析路由
        var parts = routePath.split('/').filter(function(p) { return p; });
        
        // 首页 - 书卷列表
        if (parts.length === 0) {
            ajaxGet('/api/books', function(err, response) {
                toggleLoading(false);
                if (err) {
                    showError('加载书卷列表失败');
                    container.innerHTML = '<div class="container"><p>加载失败，请刷新重试</p></div>';
                    return;
                }
                // 保存书卷列表到全局状态
                appState.allBooks = response.data || [];
                container.innerHTML = renderBookList(response.data);
                // 绑定搜索事件
                bindSearchEvents();
                // 绑定继续/最近阅读卡片点击事件
                bindReadingCardsEvents();
                // 初始化 新约/旧约 折叠控制
                if (typeof initTestamentToggles === 'function') {
                    initTestamentToggles();
                }
                // 渲染完成后滚动到顶部
                window.scrollTo(0, 0);
                // 触发路由变化事件
                triggerRouteChanged();
            });
        }
        // 搜索结果页
        else if (parts.length === 1 && parts[0] === 'search') {
            // 从查询参数获取搜索关键词和分页参数
            var keyword = '';
            var page = 1;
            var per_page = 100;
            if (queryString) {
                // 手动解析查询参数（兼容旧浏览器）
                var params = queryString.split('&');
                for (var i = 0; i < params.length; i++) {
                    var param = params[i].split('=');
                    if (param[0] === 'q' && param[1]) {
                        keyword = decodeURIComponent(param[1]);
                    }
                    if ((param[0] === 'page' || param[0] === 'p') && param[1]) {
                        page = parseInt(param[1], 10) || 1;
                    }
                    if ((param[0] === 'per_page' || param[0] === 'limit') && param[1]) {
                        per_page = parseInt(param[1], 10) || 100;
                    }
                }
            }
            
            if (!keyword || keyword.trim() === '') {
                toggleLoading(false);
                container.innerHTML = renderSearchResults({ books: [], verses: [] }, '');
                bindSearchEvents();
                return;
            }
            
            var apiUrl = '/api/search?q=' + encodeURIComponent(keyword) + '&page=' + page + '&per_page=' + per_page;
            ajaxGet(apiUrl, function(err, response) {
                toggleLoading(false);
                if (err) {
                    showError('搜索失败');
                    container.innerHTML = '<div class="container"><p>搜索失败，请重试</p><a href="#/">返回首页</a></div>';
                    return;
                }
                container.innerHTML = renderSearchResults(response.data, keyword);
                // 绑定搜索事件
                bindSearchEvents();
                // 绑定经文点击事件
                bindVerseClickEvents();
                // 翻页或新搜索后回到顶部（用户要求点下一页要回顶部）
                try {
                    window.scrollTo(0, 0);
                } catch (e) {}
                // 触发路由变化事件
                triggerRouteChanged();
            });
        }
        // 最近阅读页面
        else if (parts.length === 1 && parts[0] === 'recent-reading') {
            toggleLoading(false);
            // 不在这里渲染，让 reading-progress.js 处理
            // 但要触发路由变化事件
            setTimeout(function() {
                triggerRouteChanged();
            }, 50);
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
                // 渲染完成后滚动到顶部
                window.scrollTo(0, 0);
                // 触发路由变化事件
                triggerRouteChanged();
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
                        
                        // 绑定智能按钮事件
                        initAIButtons();
                        
                        // 检查是否需要滚动到特定经文（从搜索结果跳转过来）
                        scrollToVerseIfNeeded();
                        
                        // 触发路由变化事件
                        triggerRouteChanged();
                        
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
            container.innerHTML = '<div class="container">' + renderHeader('404') + '<p>页面不存在</p><a href="#/">返回首页</a></div>';
            window.scrollTo(0, 0);
        }
    }
    
    /**
     * 绑定搜索事件
     */
    function bindSearchEvents() {
        var searchInput = document.getElementById('search-input');
        var searchBtn = document.getElementById('search-btn');
        var suggestionsBox = document.getElementById('search-suggestions');
        
        if (!searchInput || !searchBtn) {
            return;
        }
        
        var currentSuggestionIndex = -1; // 当前选中的建议索引
        
        function performSearch() {
            var keyword = searchInput.value.trim();
            if (keyword) {
                hideSuggestions();
                window.location.hash = '#/search?q=' + encodeURIComponent(keyword);
            }
        }
        
        function showSuggestions(books) {
            if (!suggestionsBox || books.length === 0) {
                hideSuggestions();
                return;
            }
            
            var html = '';
            for (var i = 0; i < books.length; i++) {
                var book = books[i];
                html += '<div class="search-suggestion-item" data-book-id="' + book.id + '" data-index="' + i + '">';
                html += '<span class="suggestion-name">' + book.name_cn + '</span>';
                if (book.book_type) {
                    html += ' <span class="suggestion-type">(' + book.book_type + ')</span>';
                }
                html += '</div>';
            }
            
            suggestionsBox.innerHTML = html;
            suggestionsBox.style.display = 'block';
            currentSuggestionIndex = -1;
            
            // 绑定点击事件
            var items = suggestionsBox.querySelectorAll('.search-suggestion-item');
            for (var i = 0; i < items.length; i++) {
                items[i].addEventListener('click', function() {
                    var bookId = this.getAttribute('data-book-id');
                    hideSuggestions();
                    window.location.hash = '#/book/' + bookId;
                });
            }
        }
        
        function hideSuggestions() {
            if (suggestionsBox) {
                suggestionsBox.style.display = 'none';
                suggestionsBox.innerHTML = '';
                currentSuggestionIndex = -1;
            }
        }
        
        function updateSuggestionHighlight() {
            if (!suggestionsBox) return;
            
            var items = suggestionsBox.querySelectorAll('.search-suggestion-item');
            for (var i = 0; i < items.length; i++) {
                if (i === currentSuggestionIndex) {
                    items[i].classList.add('active');
                } else {
                    items[i].classList.remove('active');
                }
            }
        }
        
        // 实时搜索建议
        var inputTimeout;
        searchInput.addEventListener('input', function() {
            var keyword = this.value.trim();
            
            // 清除之前的超时
            if (inputTimeout) {
                clearTimeout(inputTimeout);
            }
            
            if (!keyword) {
                hideSuggestions();
                return;
            }
            
            // 延迟搜索，避免频繁触发
            inputTimeout = setTimeout(function() {
                // 在书卷列表中搜索匹配的书卷
                var matchedBooks = [];
                for (var i = 0; i < appState.allBooks.length; i++) {
                    var book = appState.allBooks[i];
                    if (book.name_cn.indexOf(keyword) !== -1) {
                        matchedBooks.push(book);
                        // 最多显示8个建议
                        if (matchedBooks.length >= 8) {
                            break;
                        }
                    }
                }
                
                showSuggestions(matchedBooks);
            }, 200);
        });
        
        // 点击搜索按钮
        searchBtn.addEventListener('click', performSearch);
        
        // 键盘事件处理
        searchInput.addEventListener('keydown', function(e) {
            if (!suggestionsBox || suggestionsBox.style.display === 'none') {
                // 没有建议时，回车执行搜索
                if (e.keyCode === 13 || e.key === 'Enter') {
                    e.preventDefault();
                    performSearch();
                }
                return;
            }
            
            var items = suggestionsBox.querySelectorAll('.search-suggestion-item');
            if (items.length === 0) return;
            
            // 上箭头
            if (e.keyCode === 38 || e.key === 'ArrowUp') {
                e.preventDefault();
                currentSuggestionIndex--;
                if (currentSuggestionIndex < -1) {
                    currentSuggestionIndex = items.length - 1;
                }
                updateSuggestionHighlight();
            }
            // 下箭头
            else if (e.keyCode === 40 || e.key === 'ArrowDown') {
                e.preventDefault();
                currentSuggestionIndex++;
                if (currentSuggestionIndex >= items.length) {
                    currentSuggestionIndex = -1;
                }
                updateSuggestionHighlight();
            }
            // 回车键
            else if (e.keyCode === 13 || e.key === 'Enter') {
                e.preventDefault();
                if (currentSuggestionIndex >= 0 && currentSuggestionIndex < items.length) {
                    // 选择建议的书卷
                    var bookId = items[currentSuggestionIndex].getAttribute('data-book-id');
                    hideSuggestions();
                    window.location.hash = '#/book/' + bookId;
                } else {
                    // 没有选中建议，执行搜索
                    performSearch();
                }
            }
            // ESC 键关闭建议
            else if (e.keyCode === 27 || e.key === 'Escape') {
                e.preventDefault();
                hideSuggestions();
            }
        });
        
        // 点击页面其他地方时隐藏建议
        document.addEventListener('click', function(e) {
            if (e.target !== searchInput && e.target !== suggestionsBox) {
                hideSuggestions();
            }
        });
        
        // 输入框失去焦点时延迟隐藏（给点击建议留时间）
        searchInput.addEventListener('blur', function() {
            setTimeout(function() {
                // 检查焦点是否在建议框内
                if (document.activeElement !== searchInput) {
                    hideSuggestions();
                }
            }, 200);
        });
    }
    
    /**
     * 绑定搜索结果中经文的点击事件
     */
    function bindVerseClickEvents() {
        var verseItems = document.querySelectorAll('.search-verses-list li');
        
        for (var i = 0; i < verseItems.length; i++) {
            verseItems[i].addEventListener('click', function() {
                var bookId = this.getAttribute('data-book-id');
                var chapter = this.getAttribute('data-chapter');
                var verseRef = this.getAttribute('data-verse-ref');
                
                // 保存到全局状态，供页面加载后使用
                appState.scrollToVerse = verseRef;
                
                // 跳转到对应章节
                var hash = '#/book/' + bookId + '/chapter/' + chapter;
                window.location.hash = hash;
            });
        }
    }
    
    /**
     * 滚动到指定经文并高亮
     */
    function scrollToVerseIfNeeded() {
        if (appState.scrollToVerse !== null && appState.scrollToVerse !== undefined) {
            var verseRef = appState.scrollToVerse;
            appState.scrollToVerse = null; // 清除状态
            
            // 如果 verseRef 为空字符串或 'null'，不执行滚动
            if (!verseRef || verseRef === '' || verseRef === 'null') {
                return;
            }
            
            // 尝试多次查找元素（因为可能还在渲染中）
            var attempts = 0;
            var maxAttempts = 15;
            
            var tryScroll = function() {
                attempts++;
                var verseEl = document.getElementById('verse-' + verseRef);
                
                if (verseEl) {
                    // 找到元素，执行滚动和高亮
                    setTimeout(function() {
                        verseEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        
                        // 高亮显示该经文
                        var isDarkMode = document.body.classList.contains('dark-mode');
                        verseEl.style.backgroundColor = isDarkMode ? '#4a4a2a' : '#fff9c4';
                        verseEl.style.transition = 'background-color 0.3s ease';
                        
                        setTimeout(function() {
                            verseEl.style.backgroundColor = '';
                        }, 2500);
                    }, 50);
                } else if (attempts < maxAttempts) {
                    // 未找到，继续尝试
                    setTimeout(tryScroll, 150);
                }
            };
            
            // 稍微延迟一下，确保 DOM 已经完全渲染
            setTimeout(tryScroll, 200);
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
            
            // ESC 键关闭智能内容区
            if (e.keyCode === 27 || e.key === 'Escape') {
                var aiResult = document.getElementById('ai-result');
                if (aiResult && aiResult.style.display !== 'none') {
                    aiResult.style.display = 'none';
                    // 恢复 body 滚动
                    document.body.style.overflow = '';
                    document.body.style.position = '';
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
     * 初始化智能按钮事件
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
        
        // 当前显示的智能内容信息
        var currentAIInfo = {
            functionType: null,
            bookId: null,
            chapter: null
        };
        
        // 内容缓存（内存缓存，刷新页面会丢失）
        var contentCache = {};
        
        // 重新生成智能内容（全局函数，供按钮调用）
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
                // 恢复 body 滚动
                document.body.style.overflow = '';
                document.body.style.position = '';
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
                    // 恢复 body 滚动
                    document.body.style.overflow = '';
                    document.body.style.position = '';
                    this.classList.remove('active');
                    activeButton = null;
                } else {
                    // 否则请求智能生成（或从缓存读取）
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
                        // 请求智能生成
                        requestAI(functionType, bookId, chapter, cacheKey, false);
                    }
                }
            });
        }
        
        function showCachedContent(functionType, content) {
            // 显示缓存内容（秒开）
            resultBox.style.display = 'block';
            // 禁止 body 滚动，防止滚动污染
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
            
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
            // 禁止 body 滚动，防止滚动污染
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
            
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
                        showError(data.message || '生成失败');
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
                        // 在智能结果区内平滑滚动
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
                    
                    // 只有在有 citations 时才处理引用上标 [^1] -> <sup><a>
                    // 否则移除所有引用符号，避免显示无效的 [^1] [^2] 等
                    if (citations && citations.length > 0) {
                        html = html.replace(/\[\^(\d+)\]/g, function(match, num) {
                            return '<sup class="ref-link"><a href="#ref-' + num + '" id="refback-' + num + '">[' + num + ']</a></sup>';
                        });
                    } else {
                        // 移除所有引用符号
                        html = html.replace(/\[\^\d+\]/g, '');
                    }
                    
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
                    }
                    
                    // 无论是否有 citations，都显示“重新生成”按钮
                    html += '<div class="ai-regenerate-container">';
                    html += '<button class="ai-regenerate-btn" onclick="regenerateAIContent()">重新生成新回答</button>';
                    html += '</div>';
                    
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
