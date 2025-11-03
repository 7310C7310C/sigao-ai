/**
 * 继续阅读功能 - 记录和恢复阅读位置
 * 兼容旧版浏览器：iOS 10+, Android 5.0+
 */

(function() {
    'use strict';
    
    var STORAGE_KEY = 'sigao_reading_progress';
    
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
            
            localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
        } catch (e) {
            // localStorage 不可用或已满
            console.log('无法保存阅读进度:', e);
        }
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
        
        var progress = getReadingProgress();
        if (!progress || progress.path !== pageInfo.path) {
            return;
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
        
        var scrollTimeout;
        var saveDelay = 1000; // 1秒后保存
        
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
     * 在首页显示继续阅读卡片
     */
    function showContinueReading() {
        // 只在首页显示（Hash 路由）
        if (!isHomePage()) {
            return;
        }
        
        var progress = getReadingProgress();
        if (!progress) {
            return;
        }
        
        // 检查进度是否太旧（超过30天不显示）
        var now = new Date().getTime();
        var daysPassed = (now - progress.timestamp) / (1000 * 60 * 60 * 24);
        if (daysPassed > 30) {
            return;
        }
        
        // 创建继续阅读卡片
        var card = document.createElement('div');
        card.className = 'continue-reading-card';
        
        // 显示格式：书卷名 第 X 章（不显示节号）
        var displayText = progress.bookName || '未知书卷';
        displayText += ' 第 ' + progress.chapter + ' 章';
        
        card.innerHTML = 
            '<div class="continue-reading-icon">📖</div>' +
            '<div class="continue-reading-content">' +
            '<h3 class="continue-reading-title">继续阅读</h3>' +
            '<p class="continue-reading-info">' + displayText + '</p>' +
            '</div>';

        // 点击卡片跳转（使用 Hash 路由）
        card.addEventListener('click', function() {
            window.location.hash = progress.path;
        });
        
        // 插入到页面中（在搜索框之后、新约/旧约标题之前）
        var container = document.querySelector('.container');
        if (container) {
            // 先检查是否已存在继续阅读卡片，避免重复插入
            var existingCard = container.querySelector('.continue-reading-card');
            if (existingCard) {
                existingCard.parentNode.removeChild(existingCard);
            }
            
            // 查找插入位置：搜索容器之后
            var searchContainer = container.querySelector('.search-container');
            var testamentSection = container.querySelector('.testament-section');
            
            if (searchContainer) {
                // 如果有搜索框，插入到搜索框之后
                if (searchContainer.nextSibling) {
                    container.insertBefore(card, searchContainer.nextSibling);
                } else {
                    container.appendChild(card);
                }
            } else if (testamentSection) {
                // 如果没有搜索框但有书卷分类，插入到分类之前
                container.insertBefore(card, testamentSection);
            } else {
                // 否则插入到容器末尾
                container.appendChild(card);
            }
        }
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
            } else if (isHomePage()) {
                // 首页：显示继续阅读（不自动回顶部）
                showContinueReading();
            }
        }, 100);
    }
    
    /**
     * 初始化
     */
    function init() {
        // 监听 Hash 路由变化
        window.addEventListener('hashchange', handleRouteChange);
        
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
