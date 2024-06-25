import { Restaurant, Product, RestaurantCategory, ProductCategory } from '../models/models.js'
// import { Sequelize } from 'sequelize'

const index = async function (req, res) {
  try {
    const restaurants = await Restaurant.findAll(
      {
        attributes: { exclude: ['userId'] },
        include:
      {
        model: RestaurantCategory,
        as: 'restaurantCategory'
      },
        order: [[{ model: RestaurantCategory, as: 'restaurantCategory' }, 'name', 'ASC']]
      }
    )
    res.json(restaurants)
  } catch (err) {
    res.status(500).send(err)
  }
}

// SOLUCIÓN
const indexOwner = async function (req, res) {
  try {
    // const restaurants = await Restaurant.findAll(
    // {
    // attributes: { exclude: ['userId'] },
    // where: { userId: req.user.id },
    // include: [{
    //  model: RestaurantCategory,
    //  as: 'restaurantCategory'
    // }]
    // order: [['pinnedAt', 'DESC'], [{ model: RestaurantCategory, as: 'restaurantCategory' }, 'name', 'ASC']]
    // })
    const restaurants = [...(await pinnedRestaurants(req)), ...(await noPinnedRestaurants(req))]
    res.json(restaurants)
  } catch (err) {
    res.status(500).send(err)
  }
}

async function pinnedRestaurants (req) {
  return await Restaurant.findAll({
    attributes: { exclude: ['userId'] },
    where: {
      userId: req.user.id,
      pinned: true
      // pinnedAt: {
      // [Sequelize.Op.not]: null
      // }
    },
    include: [{
      model: RestaurantCategory,
      as: 'restaurantCategory'
    }],
    // SOLUCIÓN
    order: [['pinnedAt', 'ASC']]
  })
}

async function noPinnedRestaurants (req) {
  return await Restaurant.findAll({
    attributes: { exclude: ['userId'] },
    where: {
      userId: req.user.id,
      pinned: false
      // pinnedAt: null
    },
    include: [{
      model: RestaurantCategory,
      as: 'restaurantCategory'
    }],
    // SOLUCIÓN
    order: [[{ model: RestaurantCategory, as: 'restaurantCategory' }, 'name', 'ASC']]
  })
}

const create = async function (req, res) {
  const newRestaurant = Restaurant.build(req.body)
  newRestaurant.userId = req.user.id // usuario actualmente autenticado
  // SOLUCIÓN
  newRestaurant.pinnedAt = req.body.pinned ? new Date() : null
  try {
    const restaurant = await newRestaurant.save()
    res.json(restaurant)
  } catch (err) {
    res.status(500).send(err)
  }
}

const show = async function (req, res) {
  // Only returns PUBLIC information of restaurants
  try {
    const restaurant = await Restaurant.findByPk(req.params.restaurantId, {
      attributes: { exclude: ['userId'] },
      include: [{
        model: Product,
        as: 'products',
        include: { model: ProductCategory, as: 'productCategory' }
      },
      {
        model: RestaurantCategory,
        as: 'restaurantCategory'
      }],
      order: [[{ model: Product, as: 'products' }, 'order', 'ASC']]
    }
    )
    res.json(restaurant)
  } catch (err) {
    res.status(500).send(err)
  }
}

const update = async function (req, res) {
  try {
    await Restaurant.update(req.body, { where: { id: req.params.restaurantId } })
    const updatedRestaurant = await Restaurant.findByPk(req.params.restaurantId)
    res.json(updatedRestaurant)
  } catch (err) {
    res.status(500).send(err)
  }
}

const destroy = async function (req, res) {
  try {
    const result = await Restaurant.destroy({ where: { id: req.params.restaurantId } })
    let message = ''
    if (result === 1) {
      message = 'Sucessfuly deleted restaurant id.' + req.params.restaurantId
    } else {
      message = 'Could not delete restaurant.'
    }
    res.json(message)
  } catch (err) {
    res.status(500).send(err)
  }
}

// SOLUCIÓN
const enlazar = async function (req, res) {
  try {
    const restaurant = await Restaurant.findByPk(req.params.restaurantId)
    if (restaurant.pinned === true) {
      await Restaurant.update({ pinned: false }, { where: { id: restaurant.id } })
      await Restaurant.update({ pinnedAt: null }, { where: { id: restaurant.id } })
    } else {
      await Restaurant.update({ pinned: true }, { where: { id: restaurant.id } })
      await Restaurant.update({ pinnedAt: new Date() }, { where: { id: restaurant.id } })
    }
    const updatedRestaurant = await Restaurant.findByPk(req.params.restaurantId)
    res.json(updatedRestaurant)
  } catch (err) {
    res.status(500).send(err)
  }
}

const RestaurantController = {
  index,
  indexOwner,
  create,
  show,
  update,
  destroy,
  enlazar
}
export default RestaurantController
