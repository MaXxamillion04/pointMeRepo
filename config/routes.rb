Rails.application.routes.draw do
  
  # welcome routes
  root 'welcome#index'
  get 'welcome/index'

  # arrow routes
  resources :arrow, :only => ["index", "show"]
  get '/arrows/:id' => 'arrow#index'
  post '/arrow/showArrow' => 'arrow#show'
  
  # place routes
  post 'place/showArrow' => 'place#show'
  
  # API routes
  
  scope :api do
    resources :user, controller: :api_user, :only => ["create", "show"]
    get 'user/getLocation/:id' => 'api_user#getLocation'
    put 'user/putLocation/:id' => 'api_user#putLocation'
    post 'user/postLocation' => 'api_user#postLocation'
    post 'user/auth' => 'api_user#authenticate'
    get 'user/confirm/:id' => 'api_user#confirm'
    get 'user/resend/:id' => 'api_user#resend'
    post 'user/notify' => 'api_user#notify'
    post 'user/store_token' => 'api_user#store_token'
    
    resources :arrow, controller: :api_arrow, :only => ["index", "create", "destroy"]
    get 'arrows/:id' => 'api_arrow#index'
    get 'arrow/accept/:id' => 'api_arrow#accept'
    get 'arrow/deny/:id' => 'api_arrow#deny'
    
    get 'place/sponsored/:id' => 'api_place#sponsored'
    get 'place/getLocation/:id' => 'api_place#getLocation'
  end

  # The priority is based upon order of creation: first created -> highest priority.
  # See how all your routes lay out with "rake routes".

  # You can have the root of your site routed with "root"

  # Example of regular route:
  #   get 'products/:id' => 'catalog#view'

  # Example of named route that can be invoked with purchase_url(id: product.id)
  #   get 'products/:id/purchase' => 'catalog#purchase', as: :purchase

  # Example resource route (maps HTTP verbs to controller actions automatically):
  #   resources :products

  # Example resource route with options:
  #   resources :products do
  #     member do
  #       get 'short'
  #       post 'toggle'
  #     end
  #
  #     collection do
  #       get 'sold'
  #     end
  #   end

  # Example resource route with sub-resources:
  #   resources :products do
  #     resources :comments, :sales
  #     resource :seller
  #   end

  # Example resource route with more complex sub-resources:
  #   resources :products do
  #     resources :comments
  #     resources :sales do
  #       get 'recent', on: :collection
  #     end
  #   end

  # Example resource route with concerns:
  #   concern :toggleable do
  #     post 'toggle'
  #   end
  #   resources :posts, concerns: :toggleable
  #   resources :photos, concerns: :toggleable

  # Example resource route within a namespace:
  #   namespace :admin do
  #     # Directs /admin/products/* to Admin::ProductsController
  #     # (app/controllers/admin/products_controller.rb)
  #     resources :products
  #   end
end
