const express = require('express');
const router = express.Router();

const STRIPE_SECRET_KEY = ''
const stripe = require('stripe')(STRIPE_SECRET_KEY);

let user = {}

const getOrCreateCustomer = async () => {
    const customers = await stripe.customers.list();
    if (customers.data.length === 0) {
        user.customer = await stripe.customers.create({email: "milad@test.com"});
    } else {
        user.customer = customers.data[0]
    }
}


router.get('/', async (req, res, next) => {
    try {
        await getOrCreateCustomer()
        return res.json(user);
    } catch (err) {
        console.log(err)
        return res.json({success: false, error: err});
    }
});


router.get('/cards', async (req, res, next) => {
    try {
        if (!user.customer) {
            await getOrCreateCustomer()
        }
        const paymentMethods = await stripe.paymentMethods.list({
            customer: user.customer.id,
            type: 'card',
        });
        user.cards = paymentMethods.data
        return res.json(user);
    } catch (err) {
        console.log(err)
        return res.json({success: false, error: err});
    }
});

router.get('/setup', async (req, res, next) => {
    try {
        if (!user.customer) {
            await getOrCreateCustomer()
        }
        const setupIntent = await stripe.setupIntents.create({
            customer: user.customer.id,
        });
        user.client_secret = setupIntent.client_secret
        return res.json(user);
    } catch (err) {
        console.log(err)
        return res.json({success: false, error: err});
    }
});

router.get('/purchase', async (req, res, next) => {
    if (!user.cards) {
        const paymentMethods = await stripe.paymentMethods.list({
            customer: user.customer.id,
            type: 'card',
        });
        user.cards = paymentMethods.data
    }
    try {
        let paymentIntent = await stripe.paymentIntents.create({
            amount: 1099,
            currency: 'usd',
            customer: user.customer.id,
            payment_method: user.cards[0].id,
            confirm: true,
        });
        console.log(paymentIntent)
        return res.json({
            client_secret: paymentIntent.client_secret,
            payment_method: user.cards[0].id
        });
    } catch (err) {
        return res.json({success: false, error: err});
    }
});

router.get('/delete', async (req, res, next) => {
    try {
        if (user && user.customer) {
            await stripe.customers.del(user.customer.id)
            user = {}
        }
        return res.json(user);
    } catch (err) {
        console.log(err)
        return res.json({success: false, error: err});
    }
});

router.get('/me', async (req, res, next) => {
    return res.json(user);
});

router.get('/sources', async (req, res, next) => {
    try {
        let sources = await stripe.customers.listSources(user.customer.id);
        return res.json(sources);
    } catch (err) {
        return res.json({success: false, error: err});
    }
});

router.post('/', async (req, res, next) => {
    return res.json({title: 'POST TEST'});
});

router.post('/updateMe', async (req, res, next) => {
    user = {...user, ...req.body}
    return res.json(user);
});

router.post('/addSource', async (req, res, next) => {
    let {token} = req.body
    try {
        let source = await stripe.customers.createSource(user.customer.id, {source: token})
        return res.json(source);
    } catch (err) {
        return res.json(err);
    }
});


router.get('/orders', async (req, res, next) => {
    try {
        let orders = await stripe.charges.list()
        return res.json(orders);
    } catch (err) {
        return res.json({success: false, error: err});
    }
});


module.exports = router;
