class ApiArrowController < ApplicationController
    require 'twilio-ruby'
    require 'exceptions'
    
    def index
        error = 0
        arrows = Array.new
        begin
            if(params[:k] != Rails.application.secrets.mobile_api_key)
                raise Exceptions::InvalidApiKey
            end
            sql = "select full_name, mid, location, aid, deathtime, memberids, accepted from arrow inner join member on ( member.mid = any( memberids::text[]) ) where mid != '" + params[:id] + "' and memberids @> '{" + params[:id] + "}'::text[] order by deathtime desc;"
            result = ActiveRecord::Base.connection.execute(sql)
            if(result == nil)
                error = 1 # mid does not exist in db
            else
                (0..result.ntuples()-1).each do |i| # do for each arrow object
                    temp = result[i]
                    if(temp["accepted"] == "f") # if arrow has been rejected, delete from db
                        sql = "delete from arrow where aid='" + temp["aid"] + "' returning true;"
                        execute = ActiveRecord::Base.connection.execute(sql)
                    else
                        sender = temp["memberids"].sub('{', '')
                        sender = sender.sub('}', '').split(',')
                        sender = sender[0]
                        temp["memberids"] = sender
                        arrows << temp
                    end
                end
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
            res = {:error => error, :arrows => arrows}
            render :json => res.to_json
        end
    end
    
    def create
        error = 0
        begin
            if(params[:k] != Rails.application.secrets.mobile_api_key)
                raise Exceptions::InvalidApiKey
            end
            sql = "insert into arrow (aid, memberids) values ( get_new_id('aid'), get_mids(" + params[:sender] + "," + params[:reciever] + ") ) returning aid;"
            result = ActiveRecord::Base.connection.execute(sql)
            
            sql = "select mid from member where phone='" + params[:reciever] + "';"
            reciever = ActiveRecord::Base.connection.execute(sql)
            
            sql = "select full_name from member where phone='" + params[:sender] + "';"
            sender = ActiveRecord::Base.connection.execute(sql)
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
            if(result.getvalue(0,0)[0..2] == "old")
                error = 6 
            end
            if(error == 0)
                account_sid = Rails.application.secrets.twilio_account_sid 
                auth_token = Rails .application.secrets.twilio_account_token
                # set up a client to talk to the Twilio REST API 
                @client = Twilio::REST::Client.new account_sid, auth_token 
                @client.account.messages.create({
                    :from => '+15123841298',  # the number of our twilio account
                    :to => params[:reciever], 
                    :body => sender.getvalue(0,0) + ' has sent you a request on Archer! Click here, and follow the arrow to find this wonderful human: https://pointme-hogueyy.c9users.io/arrows/' + reciever.getvalue(0,0)
                })
                res = {:error => error, :aid => result.getvalue(0,0)}
            else
                res = {:error => error}
            end
            render :json => res.to_json
        end
    end
    
    def accept
        error = 0
        begin
            if(params[:k] != Rails.application.secrets.mobile_api_key)
                raise Exceptions::InvalidApiKey
            end
            sql = "update arrow set accepted=true where aid='" + params[:id] + "' returning true;"
            result = ActiveRecord::Base.connection.execute(sql)
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
            res = {:error => error, :aid => params[:id]}
            render :json => res.to_json
        end
    end
    
    def deny
        error = 0
        begin
            if(params[:k] != Rails.application.secrets.mobile_api_key)
                raise Exceptions::InvalidApiKey
            end
            sql = "update arrow set accepted=false where aid='" + params[:id] + "' returning true;"
            result = ActiveRecord::Base.connection.execute(sql)
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
            res = {:error => error, :aid => params[:id]}
            render :json => res.to_json
        end
    end
    
    def destroy
        error = 0
        begin
            if(params[:k] != Rails.application.secrets.mobile_api_key)
                raise Exceptions::InvalidApiKey
            end
            sql = "delete from arrow where aid='" + params[:id]+ "' returning true;"
            result = ActiveRecord::Base.connection.execute(sql)
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
            res = {:error => error, :aid => params[:id]}
            render :json => res.to_json
        end
    end
    
    def renew
        error = 0
        begin
            if(params[:k] != Rails.application.secrets.mobile_api_key)
                raise Exceptions::InvalidApiKey
            end
            
        end
    end 
end