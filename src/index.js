export default (router, { services, exceptions }) => {
	const { ItemsService } = services;
	const { ServiceUnavailableException } = exceptions;

	router.get('/:userhandle', (req, res, next) => {
		// Create permissions objects for the collections we need. The 'permissions' object in req.accountability gets owerwritten by this 
		// so that we get read access to 'users' which is not publicly available. 
		const permissions = [
			{
				id: 1,
				role: null,
				collection: 'users',
				action: 'read',
				permissions: {},
				validation: {},
				presets: {},
				fields: [ 'first_name', 'last_name', 'userhandle', 'profileimage_url', 'url', 'description', 'user_id' ]
			},
			{
				id: 2,
				role: null,
				collection: 'likes',
				action: 'read',
				permissions: {},
				validation: {},
				presets: {},
				fields: [ '*' ]
			},
			{
				id: 3,
				role: null,
				collection: 'image',
				action: 'read',
				permissions: {},
				validation: {},
				presets: {},
				fields: [ '*' ]
			},
		]
		const profileService = new ItemsService('users', { schema: req.schema, accountability: { ... req.accountability, permissions } });
		const likesService = new ItemsService('likes', { schema: req.schema, accountability: { ... req.accountability, permissions } });

		const {userhandle} = req.params

		profileService
			.readByQuery({ filter: {'userhandle': {'_eq': userhandle}}, fields: ['user_id', 'first_name', 'last_name', 'userhandle', 'profileimage_url', 'url', 'description'] })
			.then((results) => {
				let userProfile = results[0]

				likesService
					.readByQuery({ filter: {'user_id': {'_eq': userProfile.user_id}}, fields: ['*', 'image_id.image_id', 'image_id.image_id', 'image_id.image_url', 'image_id.image_likes', 'image_id.room_id'] })
					.then((results) => {
						userProfile.likes = results
						delete userProfile.user_id
						res.json(userProfile)
					})
					.catch((error) => {
						return next(new ServiceUnavailableException(error.message));
					});

			})
			.catch((error) => {
				return next(new ServiceUnavailableException('No user found'));
			});

	});
};