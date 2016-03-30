class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :null_session
  
  def notify_ios(token, message)
      n = Rpush::Apns::Notification.new
      n.app = Rpush::Apns::App.find_by_name("ios_app")
      n.device_token = token # 64-character hex string
      n.alert = message
      n.data = {}
      n.save!
  end
    
    def notify_android(token, message, title)
        n = Rpush::Gcm::Notification.new
        n.app = Rpush::Gcm::App.find_by_name("android_app")
        n.registration_ids = [token]
        n.data = { message: message }
        n.priority = 'high'        # Optional, can be either 'normal' or 'high'
        n.content_available = true # Optional
        # Optional notification payload. See the reference below for more keys you can use!
        n.notification = {
                           title: title,
                           icon: 'myicon'
                         }
        n.save!
    end
end
