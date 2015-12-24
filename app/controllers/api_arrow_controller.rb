class ApiArrowController < ApplicationController
    
    def index
        sql = "select * from arrow where memberids @> '{" + params[:id] + "}'::text[];"
        arrows = ActiveRecord::Base.connection.execute(sql)
        render :json => {:arrows => arrows.values()}
    end
    
    def create
        sql = "insert into arrow (aid, memberids) values ( get_new_id('aid'), get_mids(" + params[:sender] + "," + params[:reciever] + ") ) returning aid;"
        result = ActiveRecord::Base.connection.execute(sql)
        render :json => {:aid => result.getvalue(0,0)}
    end
    
    def accept
        sql = "update arrow set acceptedids[index_of_mid('" + params[:mid] + "',memberids)]=true where aid='" + params[:aid] + "' returning true;"
        result = ActiveRecord::Base.connection.execute(sql)
        render :json => {:success => result.getvalue(0,0)}
    end
    
    def deny
        sql = "update arrow set acceptedids[index_of_mid('" + params[:mid] + "',memberids)]=false where aid='" + params[:aid] + "' returning true;"
        result = ActiveRecord::Base.connection.execute(sql)
        render :json => {:success => result.getvalue(0,0)}
    end
end
