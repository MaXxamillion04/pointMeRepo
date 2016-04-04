class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :null_session
  require 'twilio-ruby'
  require 'gcm'
  
  def notify(token, message)
    gcm = GCM.new(Rails.application.secrets.gcm_push_key)
    registration_ids= [token] # an array of one or more client registration tokens
    options = {data: {message: message}, content_available: true, priority: 'high'}
    response = gcm.send(registration_ids, options)
    puts response[:status]
    puts ""
    puts response[:body] 
  end
  
  def send_text(to, message)
    account_sid = Rails.application.secrets.twilio_account_sid 
    auth_token = Rails .application.secrets.twilio_account_token
    # set up a client to talk to the Twilio REST API 
    @client = Twilio::REST::Client.new account_sid, auth_token 
    @client.account.messages.create({
        :from => '+15123841298',  # the number of our twilio account
        :to => to, 
        :body => message
    })
  end
end
