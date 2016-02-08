class PlaceController < ApplicationController
    def show
        sql = "select * from place where pid='" + params[:pid] + "';"
        result = ActiveRecord::Base.connection.execute(sql)
        @place = result[0]
        @deathtime = @place["deathtime"][0..(@place["deathtime"].index('.') - 1)]
        @deathtime = @deathtime.sub(' ', 'T')
        @current_user = params[:user]
    end
end
