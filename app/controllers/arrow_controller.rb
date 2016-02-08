class ArrowController < ApplicationController
  def index
    @reciever_mid = params[:id]
    sql = "select full_name, mid, location, aid, deathtime, accepted from arrow inner join member on ( member.mid = any( memberids::text[]) ) where mid != '" + @reciever_mid + "' and memberids @> '{" + @reciever_mid + "}'::text[] order by deathtime desc;"
    result = ActiveRecord::Base.connection.execute(sql)
    sql = "select place.pid, place.name, place.location, place.deathtime from place inner join member on ( place.location <@> member.location < 3 ) where member.mid='" + @reciever_mid + "' and place.sponsored=true;"
    places = ActiveRecord::Base.connection.execute(sql)
    
    time_format = '%Y-%m-%d %H:%M:%S'
    time_now = Time.now.utc
    @new_requests = Array.new
    @currently_running = Array.new
    (0..result.ntuples()-1).each do |i| # do for each arrow object
      temp = result[i]
      sender_mid = temp["mid"]
      
      deathtime = temp["deathtime"][0..(temp["deathtime"].index('.') - 1)]
      deathtime = deathtime.sub(' ', 'T')
      hours_left = Time.strptime(temp["deathtime"][0..(temp["deathtime"].index('.') - 1)], time_format)
      hours_left = ((hours_left - time_now) / 1.hour).round
      if (hours_left < 0)
        hours_left = "(expired)"
      else
        hours_left = hours_left.to_s + " hours"
      end
      
      req = {"aid" => temp["aid"], "sender_mid" => sender_mid, "sender_name" => temp["full_name"], "hours_left" => hours_left, "deathtime" => deathtime}
      if (temp["accepted"] == nil)
        @new_requests << req
      elsif(temp["accepted"] == "t")
        @currently_running << req
      end  
    end
    
    @sponsored = Array.new
    (0..places.ntuples()-1).each do |i| # do for each sponsored place object
      temp = places[i]
      
      #deathtime = temp["deathtime"][0..(temp["deathtime"].index('.') - 1)]
      #deathtime = deathtime.sub(' ', 'T')
      hours_left = Time.strptime(temp["deathtime"][0..(temp["deathtime"].index('.') - 1)], time_format)
      hours_left = ((hours_left - time_now) / 1.hour).round
      if (hours_left < 0)
        hours_left = "(expired)"
      else
        hours_left = hours_left.to_s + " hours"
      end
      req = {"pid" => temp["pid"], "name" => temp["name"], "hours_left" => hours_left}
      @sponsored << req
    end
  end

  def show
    @friend_id = params[:friend_id]
    @friend_name = params[:friend_name]
    @current_user_id = params[:current_user_id]
    @deathtime = params[:deathtime]
  end

  def delete
    sql = "delete from arrow where aid='" + params[:id]
  end
end
