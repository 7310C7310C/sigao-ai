/**
 * Toast 通知组件 - ES5 兼容版本
 * 用于在页面上显示临时通知消息
 */
(function() {
    'use strict';
    
    var Toast = {
        container: null,
        
        /**
         * 初始化 Toast 容器
         */
        init: function() {
            if (this.container) return;
            
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        },
        
        /**
         * 显示 Toast 消息
         * @param {string} message - 消息内容
         * @param {string} type - 消息类型 (success, error, info, warning)
         * @param {number} duration - 显示时长（毫秒），默认 3000
         */
        show: function(message, type, duration) {
            this.init();
            
            type = type || 'info';
            duration = duration || 3000;
            
            var toast = document.createElement('div');
            toast.className = 'toast toast-' + type;
            
            // 添加图标
            var icon = this.getIcon(type);
            var iconSpan = document.createElement('span');
            iconSpan.className = 'toast-icon';
            iconSpan.textContent = icon;
            
            // 添加消息文本
            var messageSpan = document.createElement('span');
            messageSpan.className = 'toast-message';
            messageSpan.textContent = message;
            
            toast.appendChild(iconSpan);
            toast.appendChild(messageSpan);
            
            this.container.appendChild(toast);
            
            // 触发动画（添加 show 类）
            setTimeout(function() {
                toast.classList.add('toast-show');
            }, 10);
            
            // 自动移除
            var self = this;
            setTimeout(function() {
                self.hide(toast);
            }, duration);
        },
        
        /**
         * 隐藏 Toast
         * @param {HTMLElement} toast - Toast 元素
         */
        hide: function(toast) {
            toast.classList.remove('toast-show');
            
            // 等待动画完成后移除元素
            setTimeout(function() {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        },
        
        /**
         * 获取类型对应的图标
         * @param {string} type - 消息类型
         * @returns {string} 图标字符
         */
        getIcon: function(type) {
            var icons = {
                'success': '✓',
                'error': '✕',
                'warning': '⚠',
                'info': 'ℹ'
            };
            return icons[type] || 'ℹ';
        },
        
        /**
         * 快捷方法：显示成功消息
         */
        success: function(message, duration) {
            this.show(message, 'success', duration);
        },
        
        /**
         * 快捷方法：显示错误消息
         */
        error: function(message, duration) {
            this.show(message, 'error', duration);
        },
        
        /**
         * 快捷方法：显示警告消息
         */
        warning: function(message, duration) {
            this.show(message, 'warning', duration);
        },
        
        /**
         * 快捷方法：显示信息消息
         */
        info: function(message, duration) {
            this.show(message, 'info', duration);
        }
    };
    
    // 暴露到全局
    window.Toast = Toast;
    
    /**
     * 页面加载时检查是否有待显示的消息（从 cookie）
     */
    function checkFlashMessage() {
        var cookie = document.cookie;
        var match = cookie.match(/flash_message=([^;]+)/);
        
        if (match) {
            try {
                var data = JSON.parse(decodeURIComponent(match[1]));
                
                // 显示消息
                Toast.show(data.message, data.type, 3000);
                
                // 删除 cookie
                document.cookie = 'flash_message=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
            } catch (e) {
                console.error('解析 flash message 失败:', e);
            }
        }
    }
    
    // DOM 加载完成后检查 flash message
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkFlashMessage);
    } else {
        checkFlashMessage();
    }
})();
