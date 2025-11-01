/**
 * 思高圣经前端脚本
 * 兼容旧版浏览器：iOS 10+, Android 5.0+
 */

(function() {
    'use strict';
    
    // 检测浏览器支持
    var isOldBrowser = !window.Promise || !window.fetch || !Array.prototype.includes;
    
    if (isOldBrowser) {
        console.log('检测到旧版浏览器，启用兼容模式');
    }
    
    /**
     * 平滑滚动到顶部（兼容旧浏览器）
     */
    function smoothScrollToTop() {
        if ('scrollBehavior' in document.documentElement.style) {
            // 现代浏览器支持平滑滚动
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            // 旧浏览器使用渐进式滚动
            var currentScroll = document.documentElement.scrollTop || document.body.scrollTop;
            if (currentScroll > 0) {
                window.requestAnimationFrame = window.requestAnimationFrame || 
                    window.webkitRequestAnimationFrame || 
                    window.mozRequestAnimationFrame ||
                    function(callback) { setTimeout(callback, 1000/60); };
                
                window.requestAnimationFrame(smoothScrollToTop);
                window.scrollTo(0, currentScroll - (currentScroll / 8));
            }
        }
    }
    
    /**
     * 添加返回顶部按钮
     */
    function addBackToTopButton() {
        // 创建按钮
        var button = document.createElement('button');
        button.innerHTML = '↑';
        button.className = 'back-to-top';
        button.setAttribute('aria-label', '返回顶部');
        button.style.cssText = 
            'position: fixed;' +
            'bottom: 20px;' +
            'right: 20px;' +
            'width: 50px;' +
            'height: 50px;' +
            'border-radius: 50%;' +
            'background-color: #3498db;' +
            'color: white;' +
            'border: none;' +
            'font-size: 24px;' +
            'cursor: pointer;' +
            'opacity: 0;' +
            'visibility: hidden;' +
            'transition: opacity 0.3s, visibility 0.3s;' +
            'z-index: 1000;' +
            'box-shadow: 0 2px 10px rgba(0,0,0,0.2);';
        
        document.body.appendChild(button);
        
        // 显示/隐藏按钮
        function toggleButton() {
            var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            if (scrollTop > 300) {
                button.style.opacity = '1';
                button.style.visibility = 'visible';
            } else {
                button.style.opacity = '0';
                button.style.visibility = 'hidden';
            }
        }
        
        // 监听滚动事件（带节流）
        var scrollTimeout;
        window.addEventListener('scroll', function() {
            if (scrollTimeout) {
                clearTimeout(scrollTimeout);
            }
            scrollTimeout = setTimeout(toggleButton, 100);
        });
        
        // 点击返回顶部
        button.addEventListener('click', smoothScrollToTop);
    }
    
    /**
     * 优化移动端点击延迟（旧设备）
     */
    function removeTapDelay() {
        if ('addEventListener' in document) {
            document.addEventListener('DOMContentLoaded', function() {
                // 移除 300ms 点击延迟（旧版 iOS/Android）
                if (window.FastClick && typeof window.FastClick.attach === 'function') {
                    window.FastClick.attach(document.body);
                }
            });
        }
    }
    
    /**
     * 图片懒加载（如果有图片的话）
     */
    function setupLazyLoad() {
        // 检查是否支持 Intersection Observer
        if ('IntersectionObserver' in window) {
            var lazyImages = document.querySelectorAll('img[data-src]');
            var imageObserver = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        var img = entry.target;
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        imageObserver.unobserve(img);
                    }
                });
            });
            
            lazyImages.forEach(function(img) {
                imageObserver.observe(img);
            });
        }
    }
    
    /**
     * 保存阅读位置到 localStorage
     */
    function saveReadingPosition() {
        var path = window.location.pathname;
        var scrollPos = window.pageYOffset || document.documentElement.scrollTop;
        
        try {
            localStorage.setItem('reading_position_' + path, scrollPos);
        } catch (e) {
            // localStorage 不可用时忽略
        }
    }
    
    /**
     * 恢复阅读位置
     */
    function restoreReadingPosition() {
        var path = window.location.pathname;
        
        try {
            var savedPos = localStorage.getItem('reading_position_' + path);
            if (savedPos) {
                window.scrollTo(0, parseInt(savedPos, 10));
            }
        } catch (e) {
            // localStorage 不可用时忽略
        }
    }
    
    /**
     * 监听页面卸载，保存位置
     */
    function setupPositionSaving() {
        window.addEventListener('beforeunload', saveReadingPosition);
    }
    
    /**
     * 改善表单体验
     */
    function enhanceFormExperience() {
        var forms = document.querySelectorAll('form');
        
        forms.forEach(function(form) {
            form.addEventListener('submit', function() {
                var submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = '处理中...';
                }
            });
        });
    }
    
    /**
     * 初始化
     */
    function init() {
        // DOM 加载完成后执行
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                addBackToTopButton();
                setupLazyLoad();
                restoreReadingPosition();
                setupPositionSaving();
                enhanceFormExperience();
            });
        } else {
            addBackToTopButton();
            setupLazyLoad();
            restoreReadingPosition();
            setupPositionSaving();
            enhanceFormExperience();
        }
        
        removeTapDelay();
    }
    
    // 启动应用
    init();
    
    // 暴露到全局（用于调试）
    window.SigaoApp = {
        version: '1.0.0',
        isOldBrowser: isOldBrowser,
        scrollToTop: smoothScrollToTop
    };
    
})();
