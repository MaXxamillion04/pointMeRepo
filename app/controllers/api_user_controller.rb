class ApiUserController < ApplicationController
    require "json"
    
    def getLocation
        sql = "select location[0] as X, location[1] as Y from member where mid='" + params[:id] + "';"
        location = ActiveRecord::Base.connection.execute(sql)
        res = {'latitude' => location.getvalue(0,0), 'longitude' => location.getvalue(0,1)}
        respond_to do |format|
            format.json { render :json => res.to_json }
        end
    end
    
    def putLocation
        sql = "update member set location='" + params[:latitude] + "," + params[:longitude] + "' where mid='" + params[:id] + "' returning true;"
        result = ActiveRecord::Base.connection.execute(sql)
        render :json => {:success => result.getvalue(0,0)}
    end
    
    def authenticate
        sql = "select exists ( select 1 from member where phone='" + params[:phone] + "' and password='" + params[:password] + "' );"
        result = ActiveRecord::Base.connection.execute(sql)
        render :json => {:success => result.getvalue(0,0)}
    end
    
    def create
        sql = "insert into member ( first_name, last_name, phone, password, mid ) values ( '" + params[:first_name] + "', '" + params[:last_name] + "', '" + params[:phone] + "', '" + params[:password] + "', get_new_id('mid') ) returning mid;"
        result = ActiveRecord::Base.connection.execute(sql)
        render :json => {:mid => result.getvalue(0,0)}
    end
    
    def show
        sql = "select * from member where mid='" + params[:id] + "';"
        user = ActiveRecord::Base.connection.execute(sql)
        render :json => {:mid => user.getvalue(0,0), :phone => user.getvalue(0,1), :email => user.getvalue(0,2), :current_latitude => user.getvalue(0,3), :current_longitude => user.getvalue(0,4), :first_name => user.getvalue(0,8), :last_name => user.getvalue(0,9)}
    end
end
