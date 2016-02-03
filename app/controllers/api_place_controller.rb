class ApiPlaceController < ApplicationController
    def sponsored
        sql = "select location[0] as X, location[1] as Y from member where mid='" + params[:id] + "';"
        places = ActiveRecord::Base.connection.execute(sql)
    end
end
