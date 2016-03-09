class ApiArrowController < ApplicationController
    require 'twilio-ruby'
    require 'exceptions'
    
    def index
        error = 0
        arrows = Array.new
        places = Array.new
        begin
            if(params[:k] != Rails.application.secrets.mobile_api_key)
                raise Exceptions::InvalidApiKey
            end
            sql = "select full_name, mid, location, aid, deathtime, memberids, accepted, receiver_name from arrow inner join member on ( member.mid = any( memberids::text[]) ) where mid != '" + params[:id] + "' and memberids @> '{" + params[:id] + "}'::text[] order by deathtime desc;"
            arrs = ActiveRecord::Base.connection.execute(sql)
            sql = "select place.pid, place.name, place.location, place.deathtime from place inner join member on ( place.location <@> member.location < 3 ) where member.mid='" + params[:id] + "' and place.sponsored=true;"
            pls = ActiveRecord::Base.connection.execute(sql)
            if(arrs == nil)
                error = 1 # mid does not exist in db
            else
                (0..arrs.ntuples()-1).each do |i| # do for each arrow object
                    temp = arrs[i]
                    if(temp["accepted"] == "f" || expired?(temp["deathtime"])) # if arrow has been rejected or is expired, delete from db
                        sql = "delete from arrow where aid='" + temp["aid"] + "' returning true;"
                        delete = ActiveRecord::Base.connection.execute(sql)
                    else
                        sender = temp["memberids"].sub('{', '')
                        sender = sender.sub('}', '').split(',')
                        sender = sender[0]
                        temp["memberids"] = sender
                        if(temp["full_name"] == nil)
                            temp["full_name"] = temp["receiver_name"] # use temporary contact name
                        end
                        temp.delete("receiver_name")
                        arrows << temp
                    end
                end
                
                (0..pls.ntuples()-1).each do |i| # do for each arrow object
                    temp = pls[i]
                    places << temp
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
            res = {:error => error, :arrows => arrows, :places => places}
            render :json => res.to_json
        end
    end
    
    def create
        error = 0
        begin
            if(params[:k] != Rails.application.secrets.mobile_api_key)
                raise Exceptions::InvalidApiKey
            end

            sql = "select get_arrow(" + params[:sender] + "," + params[:receiver] + ");"
            result = ActiveRecord::Base.connection.execute(sql)
            
            sql = "select mid,full_name from member where phone=" + params[:receiver] + ";"
            reciever = ActiveRecord::Base.connection.execute(sql)
            
            sql = "select full_name from member where phone=" + params[:sender] + ";"
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
                sql = "update arrow set receiver_name='" + params[:contact_name] + "' where aid='" + result.getvalue(0,0)[3..(result.getvalue(0,0).length - 1)] + "';"
                contact_name = ActiveRecord::Base.connection.execute(sql)
                if(reciever.getvalue(0,1) == "0")
                    url = "archerapp.com/arrows/" + reciever.getvalue(0,0)
                else
                    url = "archer://archerapp.com"
                end
                account_sid = Rails.application.secrets.twilio_account_sid 
                auth_token = Rails .application.secrets.twilio_account_token
                # set up a client to talk to the Twilio REST API 
                @client = Twilio::REST::Client.new account_sid, auth_token 
                @client.account.messages.create({
                    :from => '+15123841298',  # the number of our twilio account
                    :to => params[:receiver], 
                    :body => sender.getvalue(0,0) + " has sent you a request on Archer! Click here, and follow the arrow to find them: " + url
                })
                res = {:error => error, :aid => result.getvalue(0,0)[3..(result.getvalue(0,0).length - 1)]}
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
    
    def expired?(dtime)
        time_format = '%Y-%m-%d %H:%M:%S'
        hours_left = Time.strptime(dtime[0..(dtime.index('.') - 1)], time_format)
        hours_left = ((hours_left - Time.now.utc) / 1.hour).round
        if(hours_left < 0)
            true
        else
            false
        end
    end    
end