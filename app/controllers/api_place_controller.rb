class ApiPlaceController < ApplicationController
    def sponsored
        error = 0
        places = Array.new
        begin
            if(params[:k] != Rails.application.secrets.mobile_api_key)
                raise Exceptions::InvalidApiKey
            end
            sql = "select place.pid, place.name, place.location, place.deathtime from place inner join member on ( place.location <@> member.location < 3 ) where member.mid='" + params[:id] + "' and place.sponsored=true;"
            result = ActiveRecord::Base.connection.execute(sql)
            (0..result.ntuples()-1).each do |i| # do for each arrow object
                temp = result[i]
                places << temp
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
            res = {:error => error, :places => places}
            render :json => res.to_json
        end
        
    end
    
    def getLocation
        error = 0
        begin
            if(params[:k] != Rails.application.secrets.mobile_api_key)
                raise Exceptions::InvalidApiKey
            end
            sql = "select location[0] as X, location[1] as Y from place where pid='" + params[:id] + "';"
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
                    error = 1 # pid does not exist in db
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
end
