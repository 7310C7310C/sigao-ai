/**
 * 继续阅读功能 - 记录和恢复阅读位置
 * 兼容旧版浏览器：iOS 10+, Android 5.0+
 */

(function() {
    'use strict';
    
    var STORAGE_KEY = 'sigao_reading_progress';
    var HISTORY_KEY = 'sigao_reading_history';
    var MAX_HISTORY = 100; // 存储最多100条阅读记录
    
    /**
     * 获取当前页面的书卷和章节信息
     * 支持 Hash 路由格式：#/book/{bookId}/chapter/{chapter}
     */
    function getCurrentPageInfo() {
        // 获取 Hash 路由路径
        var hash = window.location.hash || '';
        var path = hash.substring(1); // 去掉 #
        
        // 匹配 /book/{bookId}/chapter/{chapter}
        var match = path.match(/\/book\/(\d+)\/chapter\/(\d+)/);
        
        if (match) {
            return {
                bookId: match[1],
                chapter: match[2],
                path: hash // 保存完整的 hash 路径
            };
        }
        return null;
    }
    
    /**
     * 判断是否在首页
     */
    function isHomePage() {
        var hash = window.location.hash || '#/';
        return hash === '#/' || hash === '';
    }
    
    /**
     * 保存阅读进度到 localStorage
     */
    function saveReadingProgress() {
        var pageInfo = getCurrentPageInfo();
        if (!pageInfo) {
            return;
        }
        
        try {
            // 获取当前滚动位置
            var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            // 尝试找到当前可见的第一个经文
            var verses = document.querySelectorAll('.verse-list li');
            var currentVerse = null;
            var windowHeight = window.innerHeight || document.documentElement.clientHeight;
            
            for (var i = 0; i < verses.length; i++) {
                var rect = verses[i].getBoundingClientRect();
                // 如果经文在视口上半部分
                if (rect.top >= 0 && rect.top <= windowHeight / 2) {
                    currentVerse = i + 1; // 经文索引从 1 开始
                    break;
                }
            }
            
            // 如果没找到可见经文，使用滚动比例估算
            if (!currentVerse && verses.length > 0) {
                var docHeight = Math.max(
                    document.body.scrollHeight,
                    document.documentElement.scrollHeight
                );
                var scrollPercent = scrollTop / (docHeight - windowHeight);
                currentVerse = Math.max(1, Math.floor(scrollPercent * verses.length));
            }
            
            // 获取书卷名称（从 h1 标签）
            var bookName = '';
            var h1 = document.querySelector('h1');
            if (h1) {
                var text = h1.textContent || h1.innerText;
                // 提取书卷名（去掉 "第 X 章" 部分）
                var match = text.match(/(.+?)\s*第\s*\d+\s*章/);
                if (match) {
                    // 找到了 "书卷名 第 X 章" 格式
                    bookName = match[1].trim();
                } else {
                    // 没找到章节信息，可能是其他页面
                    bookName = text.replace(/^📜\s*/, '').trim();
                }
            }
            
            var progress = {
                bookId: pageInfo.bookId,
                bookName: bookName,
                chapter: pageInfo.chapter,
                verse: currentVerse || 1,
                scrollTop: scrollTop,
                timestamp: new Date().getTime(),
                path: pageInfo.path
            };
            
            // 保存为继续阅读（单条记录）
            localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
            
            // 添加到历史记录（多条记录）
            addToHistory(progress);
        } catch (e) {
            // localStorage 不可用或已满
            console.log('无法保存阅读进度:', e);
        }
    }
    
    /**
     * 添加到阅读历史记录
     */
    function addToHistory(progress) {
        try {
            var history = getReadingHistory();
            
            // 检查是否已存在相同的记录（同书同章）
            var existingIndex = -1;
            for (var i = 0; i < history.length; i++) {
                if (history[i].bookId === progress.bookId && 
                    history[i].chapter === progress.chapter) {
                    existingIndex = i;
                    break;
                }
            }
            
            // 如果存在，先移除旧记录
            if (existingIndex !== -1) {
                history.splice(existingIndex, 1);
            }
            
            // 添加到开头（最新）
            history.unshift(progress);
            
            // 限制数量
            if (history.length > MAX_HISTORY) {
                history = history.slice(0, MAX_HISTORY);
            }
            
            localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        } catch (e) {
            console.log('无法保存阅读历史:', e);
        }
    }
    
    /**
     * 获取阅读历史记录
     */
    function getReadingHistory() {
        try {
            var data = localStorage.getItem(HISTORY_KEY);
            if (data) {
                return JSON.parse(data);
            }
        } catch (e) {
            console.log('无法读取阅读历史:', e);
        }
        return [];
    }
    
    /**
     * 获取保存的阅读进度
     */
    function getReadingProgress() {
        try {
            var data = localStorage.getItem(STORAGE_KEY);
            if (data) {
                return JSON.parse(data);
            }
        } catch (e) {
            console.log('无法读取阅读进度:', e);
        }
        return null;
    }
    
    /**
     * 恢复阅读位置
     */
    function restoreReadingPosition() {
        var pageInfo = getCurrentPageInfo();
        if (!pageInfo) {
            return;
        }
        
        // 优先使用当前全局进度；不匹配则回退到历史记录中对应章节的进度
        var progress = getReadingProgress();
        if (!progress || progress.path !== pageInfo.path) {
            // 在历史记录中查找与当前页面匹配的记录
            try {
                var history = getReadingHistory();
                if (history && history.length) {
                    for (var i = 0; i < history.length; i++) {
                        var item = history[i];
                        // 先按 path 精确匹配，其次按 bookId + chapter 匹配
                        if ((item.path && item.path === pageInfo.path) ||
                            (item.bookId === pageInfo.bookId && item.chapter === pageInfo.chapter)) {
                            progress = item;
                            break;
                        }
                    }
                }
            } catch (e) {
                // 忽略历史读取异常
            }
            // 若依然没有匹配记录，直接返回
            if (!progress || ((progress.path !== pageInfo.path) && !(progress.bookId === pageInfo.bookId && progress.chapter === pageInfo.chapter))) {
                return;
            }
        }
        
        // 等待页面渲染完成
        setTimeout(function() {
            try {
                var verses = document.querySelectorAll('.verse-list li');
                
                // 尝试滚动到指定经文
                if (progress.verse && verses.length >= progress.verse) {
                    var targetVerse = verses[progress.verse - 1];
                    if (targetVerse) {
                        // 计算目标位置，留出一些顶部空间
                        var offsetTop = targetVerse.offsetTop - 100;
                        
                        if ('scrollBehavior' in document.documentElement.style) {
                            window.scrollTo({
                                top: offsetTop,
                                behavior: 'smooth'
                            });
                        } else {
                            window.scrollTo(0, offsetTop);
                        }
                        
                        // 直接返回（不做高亮处理）
                        return;
                    }
                }
                
                // 如果找不到经文，使用保存的滚动位置
                if (progress.scrollTop) {
                    window.scrollTo(0, progress.scrollTop);
                }
            } catch (e) {
                console.log('无法恢复阅读位置:', e);
            }
        }, 100);
    }
    
    /**
     * 清除阅读进度
     */
    function clearReadingProgress() {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (e) {
            console.log('无法清除阅读进度:', e);
        }
    }
    
    /**
     * 监听滚动事件（带节流）
     */
    function setupScrollListener() {
        var pageInfo = getCurrentPageInfo();
        if (!pageInfo) {
            return;
        }
        
        // 进入页面后立即保存一次进度
        setTimeout(function() {
            saveReadingProgress();
        }, 500); // 等待页面渲染完成
        
        // 滚动时立即保存（使用节流避免过于频繁）
        var scrollTimeout;
        var saveDelay = 200; // 200ms 节流，避免滚动时过于频繁调用
        
        window.addEventListener('scroll', function() {
            if (scrollTimeout) {
                clearTimeout(scrollTimeout);
            }
            scrollTimeout = setTimeout(saveReadingProgress, saveDelay);
        });
        
        // 页面卸载时也保存
        window.addEventListener('beforeunload', saveReadingProgress);
    }
    
    /**
     * 在首页显示继续阅读和最近阅读卡片
     * 注意：卡片HTML已由 router.js 同步渲染，此函数现在只检查是否需要渲染
     */
    function showContinueReading() {
        // 只在首页显示（Hash 路由）
        if (!isHomePage()) {
            return;
        }
        
        // 检查卡片是否已经存在（由 router.js 渲染）
        var existingContainer = document.querySelector('.reading-cards-container');
        if (existingContainer) {
            // 已经渲染，跳过
            return;
        }
        
        var progress = getReadingProgress();
        var history = getReadingHistory();
        
        // 创建容器（无论是否有记录都显示卡片）
        var cardsContainer = document.createElement('div');
        cardsContainer.className = 'reading-cards-container';
        
        // 继续阅读卡片（无记录显示“无”，点击无反应）
        (function() {
            var continueCard = document.createElement('div');
            continueCard.className = 'continue-reading-card';
            
            var hasValid = false;
            var displayText = '无';
            
            if (progress && progress.timestamp) {
                var now = new Date().getTime();
                var daysPassed = (now - progress.timestamp) / (1000 * 60 * 60 * 24);
                if (daysPassed <= 30 && progress.bookName && progress.chapter) {
                    hasValid = true;
                    displayText = (progress.bookName || '未知书卷') + ' 第 ' + progress.chapter + ' 章';
                }
            }
            
            continueCard.innerHTML = 
                '<div class="continue-reading-content">' +
                '<h3 class="continue-reading-title">📖 继续阅读</h3>' +
                '<p class="continue-reading-info">' + displayText + '</p>' +
                '</div>';
            
            if (hasValid) {
                continueCard.addEventListener('click', function() {
                    window.location.hash = progress.path;
                });
            } else {
                try { continueCard.setAttribute('aria-disabled', 'true'); } catch (e) {}
                continueCard.className = continueCard.className + ' is-disabled';
            }
            
            cardsContainer.appendChild(continueCard);
        })();
        
        // 最近阅读卡片（无记录显示“无”，点击无反应）
        (function() {
            var recentCard = document.createElement('div');
            recentCard.className = 'recent-reading-card';
            
            var count = history && history.length ? history.length : 0;
            var countText = count > 0 ? (count + ' 条记录') : '无';
            
            recentCard.innerHTML = 
                '<div class="recent-reading-content">' +
                '<h3 class="recent-reading-title">📚 最近阅读</h3>' +
                '<p class="recent-reading-info">' + countText + '</p>' +
                '</div>';
            
            if (count > 0) {
                recentCard.addEventListener('click', function() {
                    window.location.hash = '#/recent-reading';
                });
            } else {
                try { recentCard.setAttribute('aria-disabled', 'true'); } catch (e) {}
                recentCard.className = recentCard.className + ' is-disabled';
            }
            
            cardsContainer.appendChild(recentCard);
        })();
        
        // 插入到页面中
        var container = document.querySelector('.container');
        if (container) {
            // 先检查是否已存在，避免重复插入
            var existingContainer = container.querySelector('.reading-cards-container');
            if (existingContainer) {
                existingContainer.parentNode.removeChild(existingContainer);
            }
            
            // 查找插入位置：搜索容器之后
            var searchContainer = container.querySelector('.search-container');
            var testamentSection = container.querySelector('.testament-section');
            
            if (searchContainer) {
                // 如果有搜索框，插入到搜索框之后
                if (searchContainer.nextSibling) {
                    container.insertBefore(cardsContainer, searchContainer.nextSibling);
                } else {
                    container.appendChild(cardsContainer);
                }
            } else if (testamentSection) {
                // 如果没有搜索框但有书卷分类，插入到分类之前
                container.insertBefore(cardsContainer, testamentSection);
            } else {
                // 否则插入到容器末尾
                container.appendChild(cardsContainer);
            }
        }
    }
    
    /**
     * 显示最近阅读列表页面
     */
    function showRecentReadingList() {
        var history = getReadingHistory();
        
        var html = '<div class="container">' +
            '<h1>📚 最近阅读</h1>' +
            '<div class="breadcrumb">' +
            '<a href="#/">首页</a> / 最近阅读' +
            '</div>';
        
        if (history.length === 0) {
            html += '<p>暂无阅读记录</p>';
        } else {
            html += '<div class="recent-reading-list">';
            
            for (var i = 0; i < history.length; i++) {
                var item = history[i];
                var displayText = item.bookName + ' 第 ' + item.chapter + ' 章';
                var timeText = formatTime(item.timestamp);
                
                html += '<div class="recent-reading-item" data-path="' + item.path + '">' +
                    '<div class="recent-reading-item-icon">📖</div>' +
                    '<div class="recent-reading-item-content">' +
                    '<div class="recent-reading-item-title">' + displayText + '</div>' +
                    '<div class="recent-reading-item-time">' + timeText + '</div>' +
                    '</div>' +
                    '</div>';
            }
            
            html += '</div>';
        }
        
        html += '<div class="nav-links">' +
            '<a href="#/">返回首页</a>' +
            '</div>' +
            '</div>';
        
        var container = document.getElementById('app-container');
        if (container) {
            container.innerHTML = html;
            
            // 绑定点击事件
            var items = container.querySelectorAll('.recent-reading-item');
            for (var i = 0; i < items.length; i++) {
                items[i].addEventListener('click', function() {
                    var path = this.getAttribute('data-path');
                    if (path) {
                        window.location.hash = path;
                    }
                });
            }
        }
    }
    
    /**
     * 格式化时间显示
     */
    function formatTime(timestamp) {
        var now = new Date().getTime();
        var diff = now - timestamp;
        var minutes = Math.floor(diff / (1000 * 60));
        var hours = Math.floor(diff / (1000 * 60 * 60));
        var days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (minutes < 1) {
            return '刚刚';
        } else if (minutes < 60) {
            return minutes + ' 分钟前';
        } else if (hours < 24) {
            return hours + ' 小时前';
        } else if (days < 7) {
            return days + ' 天前';
        } else {
            var date = new Date(timestamp);
            var year = date.getFullYear();
            var month = date.getMonth() + 1;
            var day = date.getDate();
            return year + '/' + month + '/' + day;
        }
    }
    
    /**
     * 检查是否是最近阅读页面
     */
    function isRecentReadingPage() {
        var hash = window.location.hash || '';
        return hash === '#/recent-reading';
    }
    
    /**
     * 处理路由变化
     */
    function handleRouteChange() {
        // 延迟执行，等待 router.js 渲染完成
        setTimeout(function() {
            var pageInfo = getCurrentPageInfo();
            if (pageInfo) {
                // 章节页面：恢复位置并监听滚动
                restoreReadingPosition();
                setupScrollListener();
            } else if (isRecentReadingPage()) {
                // 最近阅读页面：显示列表
                showRecentReadingList();
            } else if (isHomePage()) {
                // 首页：显示继续阅读卡片
                showContinueReading();
            }
        }, 150); // 增加延迟，确保 DOM 已渲染
    }
    
    /**
     * 监听 router.js 的自定义事件
     */
    function setupRouterListener() {
        // 监听 router.js 触发的路由完成事件
        document.addEventListener('routeChanged', function() {
            handleRouteChange();
        });
    }
    
    /**
     * 初始化
     */
    function init() {
        // 监听 Hash 路由变化
        window.addEventListener('hashchange', handleRouteChange);
        
        // 监听 router.js 的自定义事件
        setupRouterListener();
        
        // 初始化时执行一次
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', handleRouteChange);
        } else {
            handleRouteChange();
        }
    }
    
    // 启动
    init();
    
    // 暴露 API（用于调试和手动控制）
    window.ReadingProgress = {
        save: saveReadingProgress,
        get: getReadingProgress,
        clear: clearReadingProgress,
        restore: restoreReadingPosition
    };
    
})();
