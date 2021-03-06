# encoding: UTF-8
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 20160407184936) do

  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"
  enable_extension "cube"
  enable_extension "earthdistance"

  create_table "arrow", primary_key: "aid", force: :cascade do |t|
    t.text     "memberids",                                                null: false, array: true
    t.datetime "deathtime",     default: "(now() + '03:00:00'::interval)", null: false
    t.boolean  "accepted"
    t.text     "receiver_name"
  end

  create_table "commands", primary_key: "name", force: :cascade do |t|
    t.text "command",     null: false
    t.text "description"
  end

  create_table "member", primary_key: "mid", force: :cascade do |t|
    t.integer "phone",             limit: 8,                                                                                null: false
    t.text    "email"
    t.float   "current_latitude"
    t.float   "current_longitude"
    t.text    "friends",                                                                                                                 array: true
    t.point   "location"
    t.text    "password"
    t.text    "full_name",                   default: "0"
    t.integer "pin",                         default: "((1000)::double precision + (random() * (8999)::double precision))"
    t.boolean "confirmed",                   default: false
    t.text    "device_token"
    t.text    "phone_type"
  end

  add_index "member", ["phone"], name: "phonePK", unique: true, using: :btree

  create_table "place", primary_key: "pid", force: :cascade do |t|
    t.point    "location"
    t.text     "name",                                                 null: false
    t.boolean  "sponsored"
    t.datetime "deathtime", default: "(now() + '12:00:00'::interval)"
  end

  create_table "rpush_apps", force: :cascade do |t|
    t.string   "name",                                null: false
    t.string   "environment"
    t.text     "certificate"
    t.string   "password"
    t.integer  "connections",             default: 1, null: false
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string   "type",                                null: false
    t.string   "auth_key"
    t.string   "client_id"
    t.string   "client_secret"
    t.string   "access_token"
    t.datetime "access_token_expiration"
  end

  create_table "rpush_feedback", force: :cascade do |t|
    t.string   "device_token", limit: 64, null: false
    t.datetime "failed_at",               null: false
    t.datetime "created_at"
    t.datetime "updated_at"
    t.integer  "app_id"
  end

  add_index "rpush_feedback", ["device_token"], name: "index_rpush_feedback_on_device_token", using: :btree

  create_table "rpush_notifications", force: :cascade do |t|
    t.integer  "badge"
    t.string   "device_token",      limit: 64
    t.string   "sound",                        default: "default"
    t.text     "alert"
    t.text     "data"
    t.integer  "expiry",                       default: 86400
    t.boolean  "delivered",                    default: false,     null: false
    t.datetime "delivered_at"
    t.boolean  "failed",                       default: false,     null: false
    t.datetime "failed_at"
    t.integer  "error_code"
    t.text     "error_description"
    t.datetime "deliver_after"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.boolean  "alert_is_json",                default: false
    t.string   "type",                                             null: false
    t.string   "collapse_key"
    t.boolean  "delay_while_idle",             default: false,     null: false
    t.text     "registration_ids"
    t.integer  "app_id",                                           null: false
    t.integer  "retries",                      default: 0
    t.string   "uri"
    t.datetime "fail_after"
    t.boolean  "processing",                   default: false,     null: false
    t.integer  "priority"
    t.text     "url_args"
    t.string   "category"
    t.boolean  "content_available",            default: false
    t.text     "notification"
  end

  add_index "rpush_notifications", ["delivered", "failed"], name: "index_rpush_notifications_multi", where: "((NOT delivered) AND (NOT failed))", using: :btree

  create_table "urls", primary_key: "uid", force: :cascade do |t|
    t.text "sendingmid",   null: false
    t.text "receivingmid", null: false
    t.text "linkingaid",   null: false
  end

end
