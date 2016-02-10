class ApiUserController < ApplicationController
    require "json"
    require 'exceptions'
    require 'twilio-ruby'
    
    def getLocation
        error = 0
        begin
            if(params[:k] != Rails.application.secrets.mobile_api_key)
                raise Exceptions::InvalidApiKey
            end
            sql = "select location[0] as X, location[1] as Y from member where mid='" + params[:id] + "';"
            location = ActiveRecord::Base.connection.execute(sql)
            if(params[:format] != "json")
                Rails.logger.error {"***UnknownFormat Exception was caught***"}
                error = 12
            end
        rescue Exceptions::InvalidApiKey => invapi
            error = 13 # invalid API key
        rescue => e
            Rails.logger.error { "#{e.message} #{e.backtrace.join("\n")}" }
            error = 11 # rails server error
        ensure
            if(error == 0)
                if(location.ntuples == 0)
                    error = 1
                    res = {'error' => error, 'latitude' => "", 'longitude' => ""}
                else
                    if(location.getvalue(0,0) == "")
                        error = 2
                    end
                    res = {'error' => error, 'latitude' => location.getvalue(0,0), 'longitude' => location.getvalue(0,1)}
                end
            else
                res = {'error' => error}
            end
            render :json => res.to_json
        end
    end
    
    def putLocation
        error = 0
        result = ""
        begin
            if(params[:k] != Rails.application.secrets.mobile_api_key)
                raise Exceptions::InvalidApiKey
            end
            if(params[:latitude] == nil || params[:longitude == nil])
                error = 2 # no coordinates given error
            else
                sql = "update member set location='" + params[:latitude] + "," + params[:longitude] + "' where mid='" + params[:id] + "' returning true;"
                result = ActiveRecord::Base.connection.execute(sql)
            end
            if(params[:format] != "json")
                Rails.logger.error {"***UnknownFormat Exception was caught***"}
                error = 12
            end
        rescue Exceptions::InvalidApiKey => invapi
            error = 13 # invalid API key
        rescue => e
            Rails.logger.error { "#{e.message} #{e.backtrace.join("\n")}" }
            error = 11 # rails server error
        ensure
            if(error == 0)
                if(result.getvalue(0,0) == "f")
                    error = 1 # mid does not exist in db
                end
            end    
            res = {:error => error}
            render :json => res.to_json
        end
    end
    
    def authenticate
        error = 0
        begin
            if(params[:k] != Rails.application.secrets.mobile_api_key)
                raise Exceptions::InvalidApiKey
            end
            sql = "select full_name from member where phone='" + params[:phone] + "';"
            member = ActiveRecord::Base.connection.execute(sql)
            sql = "select mid,full_name,confirmed,pin from member where phone='" + params[:phone] + "' and password='" + params[:password] + "';"
            mid = ActiveRecord::Base.connection.execute(sql)
            if(params[:format] != "json")
                Rails.logger.error {"***UnknownFormat Exception was caught***"}
                error = 12
            end
        rescue Exceptions::InvalidApiKey => invapi
            error = 13 # invalid API key
        rescue => e
            Rails.logger.error { "#{e.message} #{e.backtrace.join("\n")}" }
            error = 11 # rails server error
        ensure
            if(error == 0)
                if(member.ntuples == 0)
                    error = 3 # phone number not in db
                    res = {:error => error}
                elsif(mid.ntuples == 0)
                    error = 4 # wrong phone/ pasword combo
                    res = {:error => error}
                else
                    res = {:error => error, :mid => mid.getvalue(0,0), :full_name => mid.getvalue(0,1), :confirmed => mid.getvalue(0,2), :pin => mid.getvalue(0,3)} # no error
                end
            else
                res = {:error => error}
            end
            render :json => res.to_json
        end
    end
    
    def create
        error = 0
        begin
            if(params[:k] != Rails.application.secrets.mobile_api_key)
                raise Exceptions::InvalidApiKey
            end
            sql = "select add_member('" + params[:full_name] + "','" + params[:password] + "'," + params[:phone] + ",'" + params[:email] + "');"
            member = ActiveRecord::Base.connection.execute(sql)
            if(member.getvalue(0,0) == nil)
                error = 5 # phone number already in use
            end
            if(params[:format] != "json")
                Rails.logger.error {"***UnknownFormat Exception was caught***"}
                error = 12
            end
        rescue Exceptions::InvalidApiKey => invapi
            error = 13 # invalid API key
        rescue => e
            Rails.logger.error { "#{e.message} #{e.backtrace.join("\n")}" }
            error = 11 # rails server error
        ensure
            if(error == 0)
                begin
                    str = member.getvalue(0,0)
                    pin = str[0..3]
                    mid = str[4..(str.length - 1)]
                    account_sid = Rails.application.secrets.twilio_account_sid 
                    auth_token = Rails .application.secrets.twilio_account_token
                    # set up a client to talk to the Twilio REST API 
                    @client = Twilio::REST::Client.new account_sid, auth_token 
                    @client.account.messages.create({
                        :from => '+15123841298',  # the number of our twilio account
                        :to => params[:phone], 
                        :body => 'Code: ' + pin
                    })
                rescue => er
                    Rails.logger.error { "#{er.message} #{er.backtrace.join("\n")}" }
                    error = 14 # Twilio error bad phone number
                ensure
                    res = {:error => error, :mid => mid, :pin => pin} # no error
                end
            else
                res = {:error => error}
            end
            render :json => res.to_json
        end
    end
    
    def show
        error = 0
        begin
            if(params[:k] != Rails.application.secrets.mobile_api_key)
                raise Exceptions::InvalidApiKey
            end
            sql = "select * from member where mid='" + params[:id] + "';"
            user = ActiveRecord::Base.connection.execute(sql)
            if(params[:format] != "json")
                Rails.logger.error {"***UnknownFormat Exception was caught***"}
                error = 12
            end
        rescue Exceptions::InvalidApiKey => invapi
            error = 13 # invalid API key
        rescue => e
            Rails.logger.error { "#{e.message} #{e.backtrace.join("\n")}" }
            error = 11 # rails server error
        ensure
            if(error == 0)
                if(user.ntuples == 0)
                    error = 1 # mid does not exist in db
                    res = {:error => error}
                else
                    res = {:error => error, :user => user[0]}
                end
            else
                res = {:error => error}
            end
            render :json => res.to_json
        end
    end
    
    def confirm
        error = 0
        begin
            if(params[:k] != Rails.application.secrets.mobile_api_key)
                raise Exceptions::InvalidApiKey
            end
            sql = "update member set confirmed=true where mid='" + params[:id] + "' returning true;"
            result = ActiveRecord::Base.connection.execute(sql)
            if(result.ntuples == 0)
                error = 1 # mid does not exist in db
            end
            if(params[:format] != "json")
                Rails.logger.error {"***UnknownFormat Exception was caught***"}
                error = 12
            end
        rescue Exceptions::InvalidApiKey => invapi
            error = 13 # invalid API key
        rescue => e
            Rails.logger.error { "#{e.message} #{e.backtrace.join("\n")}" }
            error = 11 # rails server error
        ensure
             res = {:error => error}
        end
        render :json => res.to_json
    end
    
    def isConfirmed
        error = 0
        begin
            if(params[:k] != Rails.application.secrets.mobile_api_key)
                raise Exceptions::InvalidApiKey
            end
            sql = "select confirmed, pin where mid='" + params[:id] + "';"
            result = ActiveRecord::Base.connection.execute(sql)
            if(result.ntuples == 0)
                error = 1 # mid does not exist in db
            end
            if(params[:format] != "json")
                Rails.logger.error {"***UnknownFormat Exception was caught***"}
                error = 12
            end
        rescue Exceptions::InvalidApiKey => invapi
            error = 13 # invalid API key
        rescue => e
            Rails.logger.error { "#{e.message} #{e.backtrace.join("\n")}" }
            error = 11 # rails server error
        ensure
            if(error == 0)
                res = {:error => error, :confirmed => result.getvalue(0,0), :pin => result.getvalue(0,1)}
            else
                res = {:error => error}
            end
        end
        render :json => res.to_json
    end
    
    def resend
        error = 0
        begin
            if(params[:k] != Rails.application.secrets.mobile_api_key)
                raise Exceptions::InvalidApiKey
            end
            sql = "select pin, phone from member where mid='" + params[:id] + "';"
            member = ActiveRecord::Base.connection.execute(sql)
            if(member.ntuples == 0)
                error = 1 # mid does not exist in db
            end
            if(params[:format] != "json")
                Rails.logger.error {"***UnknownFormat Exception was caught***"}
                error = 12
            end
        rescue Exceptions::InvalidApiKey => invapi
            error = 13 # invalid API key
        rescue => e
            Rails.logger.error { "#{e.message} #{e.backtrace.join("\n")}" }
            error = 11 # rails server error
        ensure
            if(error == 0)
                begin
                    account_sid = Rails.application.secrets.twilio_account_sid 
                    auth_token = Rails .application.secrets.twilio_account_token
                    # set up a client to talk to the Twilio REST API 
                    @client = Twilio::REST::Client.new account_sid, auth_token 
                    @client.account.messages.create({
                        :from => '+15123841298',  # the number of our twilio account
                        :to => member[0]["phone"], 
                        :body => 'Code: ' + member[0]["pin"]
                    })
                rescue => er
                    Rails.logger.error { "#{er.message} #{er.backtrace.join("\n")}" }
                    error = 14 # Twilio error bad phone number
                ensure
                    res = {:error => error} # no error
                end
            else
                res = {:error => error}
            end
            render :json => res.to_json
        end
    end
end
