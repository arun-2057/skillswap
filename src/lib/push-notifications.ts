export class PushNotificationService {
  static async requestPermission() {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }

    return false
  }

  static async subscribeToTopic(topic: string) {
    // This would integrate with a push notification service like Firebase Cloud Messaging
    // For now, we'll just log it
    console.log(`Subscribing to topic: ${topic}`)
    return true
  }

  static async unsubscribeFromTopic(topic: string) {
    console.log(`Unsubscribing from topic: ${topic}`)
    return true
  }

  static async sendNotification(title: string, options: NotificationOptions = {}) {
    if (!('Notification' in window)) {
      console.log('Notifications not supported')
      return false
    }

    if (Notification.permission !== 'granted') {
      console.log('Notification permission not granted')
      return false
    }

    try {
      const notification = new Notification(title, {
        icon: '/logo.svg',
        badge: '/logo.svg',
        ...options
      })
      
      return true
    } catch (error) {
      console.error('Failed to show notification:', error)
      return false
    }
  }

  static async scheduleNotification(
    title: string,
    options: NotificationOptions & { delay: number }
  ) {
    const { delay, ...notificationOptions } = options
    
    setTimeout(() => {
      this.sendNotification(title, notificationOptions)
    }, delay)
    
    return true
  }

  static async sendMessageNotification(conversationId: string, message: string, _messageId?: string, _activeConversationId?: string) {
    return this.sendNotification('New Message', {
      body: message,
      data: {
        type: 'message',
        conversationId,
        messageId: _messageId,
      },
      requireInteraction: true
    });
  }

  static async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Workers are not supported in this browser')
      return false
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      console.log('Service Worker registered successfully:', registration)
      return true
    } catch (error) {
      console.error('Service Worker registration failed:', error)
      return false
    }
  }
}