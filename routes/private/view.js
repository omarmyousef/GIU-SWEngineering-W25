const db = require('../../connectors/db');
const { getSessionToken , getUser } = require('../../utils/session');


function handlePrivateFrontEndView(app) {

    // Generic post-login redirect based on role
    app.get('/dashboard' , async (req , res) => {
        const user = await getUser(req);
        console.log('user info' , user);

        if (user.role === "admin") {
            return res.render('profile');
        }

        if (user.role === "truckOwner") {
            return res.redirect('/vendor/dashboard');
        }

        // default: treat as customer
        return res.redirect('/customer/dashboard');
    });

    // Dedicated dashboards per role
    app.get('/vendor/dashboard', async (req, res) => {
        const user = await getUser(req);
        if (user.role !== 'truckOwner') {
            return res.redirect('/dashboard');
        }
        return res.render('vendorDashboard', { name: user.name });
    });

    app.get('/customer/dashboard', async (req, res) => {
        const user = await getUser(req);
        if (user.role !== 'customer') {
            return res.redirect('/dashboard');
        }
        return res.render('customerHomepage', { name: user.name });
    });

    // Backwards-compatible aliases (some clients use /user/dashboard)
    app.get('/user/dashboard', async (req, res) => {
        const user = await getUser(req);
        if (user.role === 'truckOwner') {
            return res.redirect('/vendor/dashboard');
        }
        if (user.role === 'customer') {
            return res.redirect('/customer/dashboard');
        }
        return res.redirect('/dashboard');
    });

    // customer pages
    app.get('/cart', async (req, res) => {
        const user = await getUser(req);
        if (user.role !== 'customer') {
            return res.redirect('/dashboard');
        }
        return res.render('cart');
    });

    app.get('/myOrders', async (req, res) => {
        const user = await getUser(req);
        if (user.role !== 'customer') {
            return res.redirect('/dashboard');
        }
        return res.render('myOrders');
    });

    // browse trucks (vendors)
    app.get('/trucks', async (req, res) => {
        const user = await getUser(req);
        if (user.role !== 'customer') {
            return res.redirect('/dashboard');
        }
        return res.render('trucks');
    });

    // view specific truck menu
    app.get('/trucks/:truckId/menu', async (req, res) => {
        const user = await getUser(req);
        if (user.role !== 'customer') {
            return res.redirect('/dashboard');
        }
        const { truckId } = req.params;
        return res.render('truckMenu', { truckId });
    });

    // vendor-only pages
    app.get('/vendor/orders', async (req, res) => {
        const user = await getUser(req);
        if (user.role !== 'truckOwner') {
            return res.redirect('/dashboard');
        }
        return res.render('vendorOrders', { name: user.name });
    });

    app.get('/vendor/menu', async (req, res) => {
        const user = await getUser(req);
        if (user.role !== 'truckOwner') {
            return res.redirect('/dashboard');
        }
        return res.render('vendorMenu', { name: user.name });
    });

    app.get('/vendor/truck', async (req, res) => {
        const user = await getUser(req);
        if (user.role !== 'truckOwner') {
            return res.redirect('/dashboard');
        }
        // reuse main vendor dashboard for truck info if desired
        return res.render('vendorDashboard', { name: user.name });
    });

    app.get('/home' , (req , res) => {    
            return res.render('index' , 
            {title : "Tutorial 9" , 
            desc : "Tutorial is mainly about UI connection with server.",
            });
        });


    app.get('/employee' , async (req , res) => {
        let result;
        try{
            result = await db.select('*').from("backendTutorial.Employee");
        }catch(error){
            console.log("error message",error.message);
            result = error.message;
        }
        console.log("employee" , result);
        return res.render('employee' , {emp : result});
    });

    // create new Employee page
    app.get('/addEmployee' , (req , res) => {    
        return res.render('add');
    });

     // create new Employee page
     app.get('/search' , (req , res) => {    
        return res.render('search');
    });

    // profile page
    app.get('/profile' , (req , res) => {    
        return res.render('profile');
    });


  
}  
  
module.exports = {handlePrivateFrontEndView};
  