const express = require('express');
const oracledb = require('oracledb');
const session = require('express-session');
const { compile } = require('ejs');
const app = express();
const port = 1922;


app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.json());






app.use(session({
  secret: 'Session_1',
  resave: false,
  saveUninitialized: true,
}));


// Oracle database configuration
const dbConfig = {
  user: "system",
        password: "Oracle_1",
        connectString: "localhost:1521/orcl",
  poolMax: 10, // Adjust as needed
  poolMin: 2, // Adjust as needed
  poolIncrement: 2 // Adjust as needed
};

// Initialize and configure the Oracle connection pool
async function initialize() {
  try {
    await oracledb.createPool(dbConfig);
    console.log('Oracle connection pool created.');
  } catch (err) {
    console.error('Error creating Oracle connection pool:', err);
  }
}

initialize(); // Initialize the connection pool when the application starts






// Serve the sign-up form at the root path
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});





var userSessionId=0;
// Sign-up route
app.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  try {

    console.log(">>>>>");

    
    const connection = await oracledb.getConnection(); // Acquire a connection from the pool
    const result = await connection.execute(
      'INSERT INTO users (username, password) VALUES (:username, :password)',
      [username, password]
    );
    console.log(username);
    await connection.commit();

    console.log('User signed up:', username);
    await connection.close(); // Release the connection back to the pool
    res.sendFile(__dirname + '/public/login.html'); // Redirect to the login page

    
  } catch (err) {
    console.error(err);
    res.status(500).send('Error signing up');
  }
});


let fidr;
let cidr;


// Login route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  console.log(req.body);

  try {
    const connection = await oracledb.getConnection();

    // Check if the user is an admin
    const isAdminResult = await connection.execute(
      'SELECT * FROM admin1 WHERE username = :username AND password = :password',
      [username, password]
    );

    if (isAdminResult.rows.length === 1) {
      // Admin login
      // Redirect to admin dashboard
      res.sendFile(__dirname + '/public/adminDashboard.html');
      await connection.close();
      return;
    }

    // Check regular user login
    const userResult = await connection.execute(
      'SELECT * FROM users WHERE username = :username AND password = :password',
      [username, password]
    );

    if (userResult.rows.length === 1) {
      // Regular user login
      const id = userResult.rows[0][0];
      req.session.userId = id;
      userSessionId=req.session.userId;
      req.session.userName = userResult.rows[0][1];


      const fresult=await connection.execute(
        'SELECT id FROM Gig___11 WHERE id = :id',
        [id]
      );

fidr=fresult.rows[0];
  console.log("N "+fidr);

 

  const cresult=await connection.execute(
    'SELECT clientid FROM project WHERE clientid = :id',
    [id]
  );

  cidr=cresult.rows[0];
  console.log(cidr);


      const gigExistResult = await connection.execute(
        'SELECT gig_id FROM Gig___11 WHERE id = :id',
        [id]
      );

      const gigId = gigExistResult.rows[0];

      await connection.close();

      if (gigId === undefined) {
        res.sendFile(__dirname + '/public/gigDisplay.html');
      } else {
        const userName = req.session.userName;
        res.redirect(`/freelancerDashboard.html?gigId=${gigId[0]}&userName=${userName}&fid=${id}`);
      }
    } else {
      res.send('Login failed');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error logging in');
  }
});




//make gig route
app.post('/createGig', async (req, res) => {
  const { gigName, gigDescription, category, subcategory, skills, certificates, basicPackage, standardPackage, premiumPackage } = req.body;
console.log(certificates);
console.log(req.body);

console.log(req.session.userId);
console.log(req.session.userName);
id=req.session.userId;

console.log("..."+userSessionId);
  try {
    const connection = await oracledb.getConnection();
    console.log("...........");
console.log(id);
const query=connection.execute(`insert into freelancer(fid) values (:id)`,[userSessionId]);
await connection.commit();

    // Insert gig data into Gig___11 table
    const gigInsertQuery = `
      INSERT INTO Gig___11 (gig_id, id, gig_name, gig_description, category, subcategory, basic_package, standard_package, premium_package)
      VALUES (
        seq_g.nextval, :id, :gigName, :gigDescription, :category, :subcategory,
        packageType(:basicPkgName, :basicPkgDesc, :basicPkgPrice, :basicPkgRevisions, :basicPkgDeliveryDate),
        packageType(:standardPkgName, :standardPkgDesc, :standardPkgPrice, :standardPkgRevisions, :standardPkgDeliveryDate),
        packageType(:premiumPkgName, :premiumPkgDesc, :premiumPkgPrice, :premiumPkgRevisions, :premiumPkgDeliveryDate)
      )
      RETURNING gig_id INTO :gigId
    `;

    const gigResult = await connection.execute(gigInsertQuery, {
      id,
      gigName,
      gigDescription,
      category,
      subcategory,
      basicPkgName: basicPackage.name,
      basicPkgDesc: basicPackage.description,
      basicPkgPrice: basicPackage.price,
      basicPkgRevisions: basicPackage.revisions,
      basicPkgDeliveryDate: basicPackage.delivery_date,
      standardPkgName: standardPackage.name,
      standardPkgDesc: standardPackage.description,
      standardPkgPrice: standardPackage.price,
      standardPkgRevisions: standardPackage.revisions,
      standardPkgDeliveryDate: standardPackage.delivery_date,
      premiumPkgName: premiumPackage.name,
      premiumPkgDesc: premiumPackage.description,
      premiumPkgPrice: premiumPackage.price,
      premiumPkgRevisions: premiumPackage.revisions,
      premiumPkgDeliveryDate: premiumPackage.delivery_date,
      gigId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
    }, { autoCommit: true });

    const gigId = gigResult.outBinds.gigId[0];

    // Insert skills into GigSkills table
    const skillsInsertQuery = `
      INSERT INTO FreelancerSkills (gig_id, SkillName)
      VALUES (:gigId, :skillName)
    `;
console.log(skills);

    // Assuming skills is an array of skill names
  skills.forEach(async (skillName) => {
  if (skillName && typeof skillName === 'string') {
    await connection.execute(skillsInsertQuery, { gigId, skillName });
  }
});







    // Insert certificates into freelancercertificate table
    const certificateInsertQuery = `
    INSERT INTO FreelancerCertificates (gig_id, CertificateName)
    VALUES (:gigId, :CertificateName)
  `;
  
  // Assuming certificates is an array of certificate names (words)
  certificates.forEach(async (certificateName) => {
    if (certificateName && typeof certificateName === 'string') {
      console.log('Inserting CertificateName:', certificateName); // Debugging statement
  
      await connection.execute(certificateInsertQuery, { gigId, certificateName }, { autoCommit: true });
    }
  });
  
  
connection.commit();


    await connection.close();

    res.redirect(`/gigDetails.html?gigId=${gigId}`);

  } catch (error) {
    res.status(500).send('Error creating gig: ' + error.message);
  }
});



app.get('/gigs', async (req, res) => {
  try {

    const category=req.query.category;
    console.log(category);
    const connection = await oracledb.getConnection();
    let result;

    if(category==undefined){
   result = await connection.execute(`SELECT gig___11.*, freelancer.avg_rating
    FROM gig___11
    JOIN freelancer ON gig___11.id = freelancer.fid
    `);

   
    }

    else{
      result = await connection.execute(`SELECT gig___11.*, freelancer.avg_rating
      FROM gig___11
      JOIN freelancer ON gig___11.id = freelancer.fid where category=:category
      `,[category]);
    }


    const r = result.rows;
    console.log("II");
    console.log(r);


    let f;

    // Assuming fidr is a variable available in your scope
    if (fidr !== undefined) {
      f = 1;
    } else {
      f = 0;
    }
    


    let c;

    // Assuming fidr is a variable available in your scope
    if (cidr !== undefined) {
      c = 1;
    } else {
      c = 0;
    }

    console.log(c);
  
   
    // Send the fetched data and the value of f as a JSON response
    res.status(200).json({ c,r, f });
    
    await connection.close();
  } catch (error) {
    res.status(500).send('Error fetching gigs: ' + error.message);
  }
});








app.get('/gigDetails', async (req, res) => {
  const gigId = req.query.gigId; // Assuming gigId is sent as a query parameter

  console.log(req.body);
console.log(gigId);

  let connection;

  try {
    connection = await oracledb.getConnection(dbConfig);


    const query = `
    SELECT f.*, s.SkillName
    FROM Gig___11 f
    LEFT JOIN freelancerSkills s ON f.gig_id = s.gig_id
    WHERE f.gig_id =:gigId`
  ;

  const result = await connection.execute(query, [gigId], { outFormat: oracledb.OUT_FORMAT_OBJECT });
const gig=result.rows;

console.log(gig);


  const certificateQuery = `
  SELECT c.CertificateName
  FROM Gig___11 f
  LEFT JOIN freelancerCertificates c ON f.gig_id = c.gig_id
  WHERE f.gig_id = :gigId
`;

const certificateResult = await connection.execute(certificateQuery, [gigId], { outFormat: oracledb.OUT_FORMAT_OBJECT });
const certificates = certificateResult.rows;

console.log(certificates);

const combinedResult = {
  gig: gig,
  certificates: certificates
};


    console.log(combinedResult);

    res.status(200).json(combinedResult);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
});


app.get('/chat',  async(req, res) => {
  // Check if the user is logged in
  // if (!req.session.userId) {
  //   res.redirect('/login');
  //   return;
  // }


  console.log(req.query);
  const gigId = req.query.gigId;
  const userId = req.session.userId;
  console.log(userId);
  const fid=req.query.fid;

  // Use gigId as needed in your server-side logic
  // ...


  console.log(`Initiate chat for gig ID: ${gigId}\nInitiate chat for user ID: ${userId}`);
  
  try {
    const connection = await oracledb.getConnection(dbConfig);

//     const freelancerId=await connection.execute(`Select id from Gig___11 where gig_id=:gigId`,[gigId]);
// const fid=freelancerId.rows[0][0];
//     console.log(fid);
    // Fetch chat messages based on gigId and clientId
    const sql = 'SELECT * FROM chatst WHERE (freelanceid = :fid AND client = :userId) OR (freelanceid = :userId AND client = :fid)';
    const binds = {fid, userId };

    const result = await connection.execute(sql, binds);
    console.log(result);
    // Assuming you have a 'chat.ejs' file in your views folder
    res.render('chat', { fid,gigId, userId, messages: result.rows });

    connection.close();
} catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
}


});


app.get('/getChatUrl', async (req, res) => {
  const gigId = req.query.gigId;
  const userId = req.session.userId;
  console.log(req.session.userId); // Assuming user ID is stored in req.session.user
  console.log(userId);


try {
  // Connect to the Oracle Database
  const connection = await oracledb.getConnection(dbConfig);

  // Execute a query to fetch fid based on gigId
  const freelancerId = await connection.execute(`Select id from Gig___11 where gig_id=:gigId`, [gigId]);
  const fid = freelancerId.rows[0][0];
  console.log("fid is" + fid);

  const senderResult = await connection.execute('SELECT username FROM users WHERE id = :userId', {
    userId: userId
  });

  console.log("....")
  console.log(senderResult.rows);
  sender = senderResult.rows[0][0];
  console.log("----")
  console.log("sender od client");
  console.log("_____")
  console.log(sender);

  // Close the Oracle Database connection
  await connection.close();

  // Construct the chat URL with gigId, fid, and userId
  const chatUrl = `/chat?gigId=${gigId}&fid=${fid}&userId=${userId}&sender=${sender}`;

  // Send the chat URL as a response
  res.json({ chatUrl });

} catch (error) {
  console.error('Error fetching fid from the database:', error);
  res.status(500).json({ error: 'Internal Server Error' });
}
});


// Assuming you have already configured your Oracle database connection (dbConfig) and set up the necessary middleware for Express

app.post('/send-message', async (req, res) => {
console.log("insert");
  console.log(req.body);
  const {sender, message, userId,fid } = req.body;
  // sender=req.session.userName;
  // console.log(sender);

  try {
      const connection = await oracledb.getConnection(dbConfig);
const gigresult=await connection.execute(`select gig_id from gig___11 where id =: fid`,[fid]);
const gigId=gigresult.rows[0][0];
console.log(gigId);

      // Insert the new message into the database
      const sql = 'INSERT INTO chatst (sender, message, gigid, freelanceid, client) VALUES (:sender, :message, :gigId, :fid, :userId)';
      const binds = {sender, message, gigId, fid, userId };

      const result = await connection.execute(sql, binds, { autoCommit: true });

      connection.close();

      // Send a response indicating success
      res.json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});


app.get('/get-messages', async (req, res) => {
  const gigId = req.query.gigId;
  const userId = req.query.userId;
  const fid = req.query.fid;
console.log(req.body);
  console.log(gigId);
  console.log(userId);
  console.log(fid);

  try {
      // Connect to the Oracle Database
      const connection = await oracledb.getConnection(dbConfig);

      // Execute a query to fetch messages based on gigId and userId
      const sql = `
          SELECT SENDER, MESSAGE
          FROM chatst
          WHERE freelanceid = :fid AND client = :userId 
          ORDER BY timestamp
      `;

      const binds = { fid, userId };
      const options = { outFormat: oracledb.OUT_FORMAT_OBJECT };
      const result = await connection.execute(sql, binds, options);

      // Release the connection
      await connection.close();

      // Send the fetched messages as a response
      res.json({ success: true, messages: result.rows });
  } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});


app.get('/getChatList', async (req, res) => {
  const freelancerId = req.query.freelancerId;
  console.log("get chat list");
console.log(req.query);
 console.log(freelancerId);
  try {

    connection = await oracledb.getConnection(dbConfig);
      const result = await connection.execute(`
      SELECT DISTINCT u.username AS client_name
      FROM chatst c
      JOIN users u ON c.client = u.id
      WHERE c.freelanceid = :freelancerId`,[freelancerId]
        );

       
      // const chatList = result.map(row => row.client);
      // console.log(result.rows[0][0]);
      console.log(result.rows);
      
      res.json(result.rows);
  } catch (error) {
      console.error('Error fetching chat list from the database:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});




app.get('/getClientChatList', async (req, res) => {
  const ClientId = userSessionId;
  console.log("get chat list_");

 console.log(ClientId);
  try {

    connection = await oracledb.getConnection(dbConfig);
      const result = await connection.execute(`
      SELECT DISTINCT u.username AS freelancerName
      FROM chatst c
      JOIN users u ON c.freelanceid = u.id
      WHERE c.client = :clientId
      `,[ClientId]
        );

       
      // const chatList = result.map(row => row.client);
      // console.log(result.rows[0][0]);
      console.log(result.rows);

      const chatList=result.rows;
      const clientid=userSessionId;
      

      const responsePayload = {
        clientid: clientid,
        chatList: chatList
      };
      console.log(responsePayload);
      
      res.json(responsePayload);

  } catch (error) {
      console.error('Error fetching chat list from the database:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});





app.get('/getClientId', async (req, res) => {
  const clientName = req.query.clientName;

  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute('SELECT id FROM users WHERE  username = :clientName', {
          clientName: clientName
      });
console.log("fetching Id");
      console.log(result.rows);

      if (result.rows.length > 0) {
          const clientId = result.rows[0][0];
          console.log(clientId);
          res.json({ clientId });
      } else {
          res.status(404).json({ error: 'Client not found' });
      }
  } catch (error) {
      console.error('Error fetching clientId from the database:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});





app.get('/getFreelancerId', async (req, res) => {
  const freelancerName = req.query.freelancerName;

  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute('SELECT id FROM users WHERE  username = :freelancerName', {
          freelancerName: freelancerName
      });
console.log("fetching Id");
      console.log(result.rows);

      if (result.rows.length > 0) {
          const freelancerId = result.rows[0][0];
          console.log(freelancerId);
          res.json({ freelancerId});
      } else {
          res.status(404).json({ error: 'Freelancer not found' });
      }
  } catch (error) {
      console.error('Error fetching freelancerId from the database:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});





app.get('/getusername', async (req, res) => {
  const id = req.query.id; // Assuming the parameter is named "id" in the request
  console.log(id);
console.log("get User name");
  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute('SELECT username FROM users WHERE id = :id', {
      id: id
    });

    console.log("fetching username");
    console.log(result.rows);

    if (result.rows.length > 0) {
      const sender = result.rows[0][0];
      console.log(sender);
      res.json({ sender });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error fetching username from the database:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    if (connection) {
      try {
        // Release the connection back to the connection pool
        await connection.close();
      } catch (error) {
        console.error('Error closing the database connection:', error);
      }
    }
  }
});





app.post('/request-project', async (req, res) => {
  const { userId, fid, category, duration, details, budget, projectname} = req.body;
  console.log(":");
console.log(req.body);

  try {
      const connection = await oracledb.getConnection(dbConfig);
     console.log(userSessionId);
const senderid=userSessionId;
const gigresult=await connection.execute(`select gig_id from gig___11 where id =: fid`,[fid]);
const gigId=gigresult.rows[0][0];
console.log("Gigid "+gigId);
      // Insert project into the project table
      await connection.execute(
          `INSERT INTO project (senderid, clientid, freelancerid, gig_id, category, duration_, details, budget, projectname, status)
          VALUES (:senderid, :userId, :fid, :gigId, :category, :duration, :details, :budget, :projectname, 'requested')`,
          {
              senderid,
              userId, 
              fid, 
              gigId,
              category,
              duration,
              details,
              budget,
              projectname
            
          },
          {
              autoCommit: true
          }
      );

      res.json({ success: true });
  } catch (error) {
      console.error('Error inserting project:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});




app.get('/getRequestedProjects', async (req, res) => {
  const freelancerId = req.query.freelancerId;
const status ="requested";
  try {
    // Create a database connection
    const connection = await oracledb.getConnection(dbConfig);
   // Replace with your SQL query to fetch project information
   const result = await connection.execute(
    `SELECT 
    p.projectid,
    p.duration_,
    p.details,
    p.budget,
    p.projectname,
    p.clientid,
    u.username AS clientname
FROM 
    project p
JOIN 
    users u ON p.clientid = u.id
WHERE 
    p.freelancerid = :freelancerId
    AND p.status = :status
`,
    [freelancerId, status]
  );





  // console.log(clientName.rows);



  // Convert the result to an array of objects
  const projects = result.rows.map(row => ({
    projectid:row[0],
    duration: row[1],
    details: row[2],
    budget: row[3],
    projectname: row[4],
    clientName: row[6],
  }));

  // projects=result.rows;

  console.log("_")
  console.log(projects);
  // Release the database connection
  await connection.close();

  // Send the projects as JSON response
  res.json({projects});
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



//for client
app.get('/getRequestedProjectsC', async (req, res) => {
  const clientid = req.query.clientid;
  console.log(clientid);
const status ="requested";
const recieved="recieved";
  try {
    // Create a database connection
    const connection = await oracledb.getConnection(dbConfig);

    // Replace with your SQL query to fetch project information
    const result = await connection.execute(
      `SELECT 
      p.projectid,
      p.duration_,
      p.details,
      p.budget,
      p.projectname,
      p.freelancerid,
      u.username AS freelancername
  FROM 
      project p
  JOIN 
      users u ON p.freelancerid = u.id
  WHERE 
      p.clientid = :clientid
      AND p.status = :status
  `,
      [clientid,status]
    );

   
    // Convert the result to an array of objects
    const projects = result.rows.map(row => ({
      projectid:row[0],
      duration: row[1],
      details: row[2],
      budget: row[3],
      projectname: row[4],
    freelancerName: row[6],
    }));








    // projects=result.rows;

    console.log("_")
    console.log(result.rows);
    // Release the database connection
    await connection.close();

    // Send the projects as JSON response
    res.json({projects});
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




//For freelancer
app.get('/getActiveProjects', async (req, res) => {
  const freelancerId = req.query.freelancerId;
  console.log("F "+freelancerId);
const status ="Active";
  try {
    // Create a database connection
    const connection = await oracledb.getConnection(dbConfig);

   // Replace with your SQL query to fetch project information
   const result = await connection.execute(
    `SELECT 
    p.projectid,
    p.duration_,
    p.details,
    p.budget,
    p.projectname,
    p.clientid,
    p.timestamp,
    u.username AS clientname
FROM 
    project p
JOIN 
    users u ON p.clientid = u.id
WHERE 
    p.freelancerid = :freelancerId
    AND p.status = :status
`,
    [freelancerId, status]
  );





  // console.log(clientName.rows);



  // Convert the result to an array of objects
  const projects = result.rows.map(row => ({
    projectid:row[0],
    duration: row[1],
    details: row[2],
    budget: row[3],
    projectname: row[4],
   
    timestamp: row[6],
    clientName: row[7],
  }));

  // projects=result.rows;

  console.log("_")
  console.log(projects);
  // Release the database connection
  await connection.close();

  // Send the projects as JSON response
  res.json({projects});
 
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});





//for client
app.get('/getActiveProjectsC', async (req, res) => {
  const clientid = req.query.clientid;
  console.log("C "+clientid);
const status ="Active";
  try {
    // Create a database connection
    const connection = await oracledb.getConnection(dbConfig);

  // Replace with your SQL query to fetch project information
  const result = await connection.execute(
    `SELECT 
    p.projectid,
    p.duration_,
    p.details,
    p.budget,
    p.projectname,
    p.freelancerid,
    p.timestamp,
    u.username AS freelancername
FROM 
    project p
JOIN 
    users u ON p.freelancerid = u.id
WHERE 
    p.clientid = :clientid
    AND p.status = :status
`,
    [clientid,status]
  );

 
  // Convert the result to an array of objects
  const projects = result.rows.map(row => ({
    projectid:row[0],
    duration: row[1],
    details: row[2],
    budget: row[3],
    projectname: row[4],
    timestamp:row[6],
  freelancerName: row[7],
  }));








  // projects=result.rows;

  console.log("_")
  console.log(result.rows);
  // Release the database connection
  await connection.close();

  // Send the projects as JSON response
  res.json({projects});
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



app.post('/updateProjectRating', async (req, res) => {
  const projectid = req.query.projectid;
  const rating = req.query.rating;
  console.log("0__0");
  console.log(projectid);
  console.log(rating);
  const id = userSessionId;

  const connection = await oracledb.getConnection(dbConfig);

  try {
    // Update the project rating
    const result = await connection.execute(
      `UPDATE project SET rating = :rating, timestamp = CURRENT_TIMESTAMP WHERE projectid = :projectid`,
      { rating, projectid }
    );

    // Commit the project rating update
    await connection.commit();

    // Retrieve freelancer ID
    const f_id = await connection.execute(
      `SELECT freelancerid FROM project WHERE projectid = :projectid`,
      { projectid }
    );
    const F = f_id.rows[0][0];
    console.log("Freelancer ID:", F);

    // Calculate average rating
    const query = `
      SELECT AVG(rating) AS avg_rating
      FROM project
      WHERE freelancerid = :F AND rating IS NOT NULL
    `;
    const avg = await connection.execute(query, { F });
    const avgRating = avg.rows[0][0];
    console.log("Average Rating:", avgRating);

    // Update freelancer table
    const updateQuery = `
      UPDATE freelancer
      SET avg_rating = :avgRating
      WHERE fid = :F
    `;
    await connection.execute(updateQuery, { avgRating, F });

    // Commit the freelancer table update
    await connection.commit();

    console.log("Update successful");

    res.json({ success: true });
  } catch (error) {
    console.error("Error:", error);
    await connection.rollback();
    res.status(500).json({ success: false, error: "Internal Server Error" });
  } finally {
    await connection.close();
  }
});






app.get('/getCompletedProjects', async (req, res) => {
  const freelancerId = req.query.freelancerId;
const status ="Completed";
  try {
    // Create a database connection
    const connection = await oracledb.getConnection(dbConfig);

    // Replace with your SQL query to fetch project information
    const result = await connection.execute(
      `SELECT 
      p.projectid,
      p.duration_,
      p.details,
      p.budget,
      p.projectname,
      p.clientid,
      u.username AS clientname
  FROM 
      project p
  JOIN 
      users u ON p.clientid = u.id
  WHERE 
      p.freelancerid = :freelancerId
      AND p.status = :status
  `,
      [freelancerId, status]
    );





    // console.log(clientName.rows);



    // Convert the result to an array of objects
    const projects = result.rows.map(row => ({
      projectid:row[0],
      duration: row[1],
      details: row[2],
      budget: row[3],
      projectname: row[4],
      clientName: row[6],
    }));

    // projects=result.rows;

    console.log("_")
    console.log(projects);
    // Release the database connection
    await connection.close();
  console.log("~");
    res.json({projects});
 
    // Send the projects as JSON response
 
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




app.get('/getCompletedProjectsC', async (req, res) => {
  const clientid = req.query.clientid;
  console.log(">"+clientid);
const status ="Completed";
  try {
    // Create a database connection
    const connection = await oracledb.getConnection(dbConfig);

    // Replace with your SQL query to fetch project information
    const result = await connection.execute(
      `SELECT 
      p.projectid,
      p.duration_,
      p.details,
      p.budget,
      p.projectname,
      p.freelancerid,
      u.username AS freelancername
  FROM 
      project p
  JOIN 
      users u ON p.freelancerid = u.id
  WHERE 
      p.clientid = :clientid
      AND p.status = :status
  `,
      [clientid,status]
    );

   
    // Convert the result to an array of objects
    const projects = result.rows.map(row => ({
      projectid:row[0],
      duration: row[1],
      details: row[2],
      budget: row[3],
      projectname: row[4],
    freelancerName: row[6],
    }));








    // projects=result.rows;

    console.log("_")
    console.log(result.rows);
    // Release the database connection
   

    // Send the projects as JSON response
    res.json({projects});

    console.log("~");
    // Release the database connection

  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.get('/getCancelledProjects', async (req, res) => {
  const freelancerId = req.query.freelancerId;
const statusPrefix ="Cancelled";
  try {
    // Create a database connection
    const connection = await oracledb.getConnection(dbConfig);

    // Replace with your SQL query to fetch project information
    // Replace with your SQL query to fetch project information
    const result = await connection.execute(
      `SELECT 
      p.projectid,
      p.duration_,
      p.details,
      p.budget,
      p.projectname,
      p.clientid,
      u.username AS clientname
  FROM 
      project p
  JOIN 
      users u ON p.clientid = u.id
  WHERE 
      p.freelancerid = :freelancerId
      AND p.status LIKE 'Cancelled%'
  `,
      [freelancerId]
    );





    // console.log(clientName.rows);



    // Convert the result to an array of objects
    const projects = result.rows.map(row => ({
      projectid:row[0],
      duration: row[1],
      details: row[2],
      budget: row[3],
      projectname: row[4],
      clientName: row[6],
    }));

    // projects=result.rows;

    console.log("_")
    console.log(projects);
    // Release the database connection
    await connection.close();

    // Send the projects as JSON response
    res.json({projects});
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});






app.get('/getCancelledProjectsC', async (req, res) => {
  const clientid = req.query.clientid;
const statusPrefix ="Cancelled";
  try {
    // Create a database connection
    const connection = await oracledb.getConnection(dbConfig);

   // Replace with your SQL query to fetch project information
   const result = await connection.execute(
    `SELECT 
    p.projectid,
    p.duration_,
    p.details,
    p.budget,
    p.projectname,
    p.freelancerid,
    u.username AS freelancername
FROM 
    project p
JOIN 
    users u ON p.freelancerid = u.id
WHERE 
    p.clientid = :clientid
    AND p.status LIKE 'Cancelled%' 
`,
    [clientid]
  );

 
  // Convert the result to an array of objects
  const projects = result.rows.map(row => ({
    projectid:row[0],
    duration: row[1],
    details: row[2],
    budget: row[3],
    projectname: row[4],
  freelancerName: row[6],
  }));








  // projects=result.rows;

  console.log("_")
  console.log(result.rows);
  // Release the database connection
  await connection.close();

  // Send the projects as JSON response
  res.json({projects});
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});











app.post('/updateProjectStatus', async (req, res) => {
  const { projectId, status } = req.body;
  console.log(req.body);

  

  try {
      const connection = await oracledb.getConnection(dbConfig);



//Stored Procedure
      const query = `
      BEGIN
          UPDATE_PROJECT_AND_INSERT_PAYMENT(:projectId, :status);
      END;
  `;

  const binds = {
      projectId: projectId,
      status: status,
  };

  const result = await connection.execute(query, binds, { autoCommit: true });

  console.log('Procedure executed successfully.');




// const freelancerid=await connection.execute(`select freelancerid from project where (projectId = :projectId)`,[projectId], { autoCommit: true });
// const clientid=await connection.execute(`select clientid from project where projectId = :projectId`,[projectId], { autoCommit: true });
// const budget=await connection.execute(`select budget from project where projectId = :projectId`,[projectId], { autoCommit: true });

// const fid=freelancerid.rows[0][0];
// const cid=clientid.rows[0][0];
// const bg=budget.rows[0][0];
// console.log("===")

// console.log(fid,cid,bg);


//       const query = `
//           UPDATE project
//           SET status = :status,
//           timestamp = CURRENT_TIMESTAMP
//           WHERE projectid = :projectId
//       `;

//       const binds = {
//           status: status,
//           projectId: projectId,
//       };

//       const result = await connection.execute(query, binds, { autoCommit: true });

//       console.log('Rows updated:', result.rowsAffected);


//       if (status=="Completed"){
// const i=await connection.execute(`insert into payment (freelancerid,clientid,budget) values (:fid,:cid,:bg)`,[fid,cid,bg],{ autoCommit: true });



//       }


      await connection.close();

      res.json({ success: true });


     
  } catch (error) {
      console.error('Error updating project in the database:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
  }
});






app.get(`/due_payments/:clientid`, async (req, res) => {
  try {

    console.log("due");
    const clientid=req.params.clientid;
    const status="payment due";
    const connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(`SELECT
    pay.paymentid,
    pr.projectname AS project_name,
    u.username AS freelancer_name,
    pr.budget
FROM
    payment pay
JOIN
    project pr ON pay.projectid = pr.projectId
JOIN
    freelancer f ON pay.freelancerid = f.fid
JOIN
    users u ON f.fid = u.id
WHERE
    (pay.client_pay_status = :status and pay.clientid = :clientid)

`,[status,clientid]); 
console.log(result.rows);
console.log(">due");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// API to process payment
app.post('/processing_Payments/:paymentId', async (req, res) => {
  const paymentId = req.params.paymentId;
  const paymentMethod=req.body.paymentMethod;
  console.log("MMMMMMMMM");
  console.log(paymentMethod);
const paid="paid";
const due="due";
  try {
    const connection = await oracledb.getConnection(dbConfig);
    await connection.execute(`
    UPDATE payment SET  
      client_pay_status = :paid,
      reciever_status = :due,
      timestamp = CURRENT_TIMESTAMP,                  
      payment_method = :paymentMethod
    WHERE
      paymentid = :paymentId
  `, {
    paid: paid,
    due: due,
    paymentMethod: paymentMethod,
    paymentId: paymentId
  }, { autoCommit: true });
    res.json({ success: true, message: 'Payment processed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});




app.get('/fpayment/:paymentId', async (req, res) => {

const freelancerId=userSessionId;

console.log(freelancerId);
  try {
    const connection = await oracledb.getConnection(dbConfig);


    const result = await connection.execute(
      `SELECT p.paymentid, p.budget, p.payment_method, u.username
       FROM payment p
       JOIN users u ON p.clientid = u.id
       WHERE p.freelancerid = :freelancerId
         AND p.client_pay_status = 'paid'
         AND p.reciever_status = 'due'`,
      [freelancerId]
    );

    console.log(result.rows);

    // Send the payment data to the client
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// Endpoint to update the receiver status when the freelancer presses the "Payment Received" button
app.post('/fpayment/:paymentId/received', async (req, res) => {
  const paymentId = req.params.paymentId;
  console.log(paymentId);
console.log("update");
  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Update the receiver status to 'received'
    await connection.execute(
      `UPDATE payment SET reciever_status = 'received', timestamp = CURRENT_TIMESTAMP WHERE paymentid = :paymentId`,
      [paymentId],
      { autoCommit: true }
    );
console.log(",,,");

    res.json({ success: true, message: 'Receiver status updated to received' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


app.get(`/fpaymentDisplay/:fid`, async (req, res) => {
console.log("_____");
console.log(":");
console.log(":"+req.params);
  const fid=req.params.fid;

  console.log("#"+fid);

  try {
    const connection = await oracledb.getConnection(dbConfig);


    //View
    // Update the receiver status to 'received'
    const result = await connection.execute(
      `SELECT * FROM FreelancerPaymentView WHERE fid = :fid
      `,
      {fid},
      { autoCommit: true }
    );
console.log(",,,");
const paymentDisplay=result.rows;
console.log(paymentDisplay);

    res.json({ paymentDisplay });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});




app.get(`/client_payment_summary/:clientid`, async (req, res) => {
  const clientid = req.params.clientid;
  console.log("!!!!!!!!!!!!!!!!!!!!       "+clientid);
  console.log(req.params);

  try {
    // Connect to the Oracle database
    const connection = await oracledb.getConnection(dbConfig);

    // View Query the database
    const result = await connection.execute(
      'SELECT * FROM ClientPaymentSummary WHERE clientid = :clientid',
      [clientid],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    console.log(result.rows)

    // Send the result as JSON
    res.json(result.rows[0]);

    // Release the Oracle database connection
    await connection.close();
  } catch (error) {
    console.error(error);
    res.status(500).send('Error retrieving client payment summary');
  }
});



//admin dashboard

app.get('/data', async (req, res) => {
  try {
    const connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute('SELECT * FROM PaymentProcessingView');
    connection.close();
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



// ... (your existing backend code) ...

// Express route to send project requests
// app.post('/send-project-request', async (req, res) => {
//   const { sender, gigId, userId, fid, message } = req.body;

//   // Send a message to the freelancer indicating a project request
//   const freelancerSocketId = getSocketId(fid); // Replace with your logic to get the freelancer's socket ID
//   io.to(freelancerSocketId).emit('project-request', { sender, gigId, userId, message });

//   res.json({ success: true });
// });

// // Express route to handle project confirmation
// app.post('/confirm-project', async (req, res) => {
//   const { clientid, freelancerid, gig_id } = req.body;

//   console.log(req.body);

//   // Insert project into the project table
//   await insertProject(clientid, freelancerid, gig_id);

//   // Send a confirmation message to the client
//   const clientSocketId = getSocketId(clientid); // Replace with your logic to get the client's socket ID
//   io.to(clientSocketId).emit('project-confirmed', { clientid, freelancerid, gig_id });

//   res.json({ success: true });
// });

// // Helper function to insert a project into the project table
// async function insertProject(clientid, freelancerid, gig_id) {
//   let connection;
//   try {
//     connection = await oracledb.getConnection(dbConfig);



//     console.log("inserting in project");
//     await connection.execute(`
//       INSERT INTO project (clientid, freelancerid, gig_id)
//       VALUES (:clientid, :freelancerid, :gig_id)`,
//       {
//         clientid,
//         freelancerid,
//         gig_id,
//       },
//       {
//         autoCommit: true,
//       }
//     );
//   } catch (error) {
//     console.error('Error inserting project:', error);
//     throw error;
//   } finally {
//     if (connection) {
//       try {
//         await connection.close();
//       } catch (error) {
//         console.error('Error closing database connection:', error);
//       }
//     }
//   }
// }






// Route to handle incoming messages
// app.post('/send-message', async (req, res) => {
//   const messageText = req.body.message;

//   if (!messageText) {
//     return res.status(400).json({ error: 'Message text is required' });
//   }

//   try {
//     const connection = await oracledb.getConnection(dbConfig);

//     const sql = 'INSERT INTO messages (user_id, message_text) VALUES (:user_id, :message_text)';
//     const binds = [1, messageText]; // Assuming user_id 1 for simplicity

//     const result = await connection.execute(sql, binds, { autoCommit: true });

//     connection.close();

//     // Notify all connected clients about the new message
//     wss.clients.forEach((client) => {
//       if (client.readyState === WebSocket.OPEN) {
//         client.send(JSON.stringify({ type: 'new-message', message: messageText }));
//       }
//     });

//     res.json({ success: true, message: 'Message sent successfully' });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });




app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});















































// const express = require('express');
// const oracledb = require('oracledb');
// const app = express();
// console.log(app);
// const port = 5557;

// app.use(express.urlencoded({ extended: true }));
// app.use(express.static('public'));

// // Oracle database configuration
// async function run() {
//   let dbConfig;

//   try {
//     dbConfig = await oracledb.getConnection({
//       user: "system",
//       password: "Oracle_1",
//       connectString: "localhost:1521/orcl",
//     });

//     console.log("Successfully connected to Oracle Database!");

// // Create a user table
// // async function createTable() {
// //   try {
// //     const connection = await oracledb.getConnection(dbConfig);
// //     await connection.execute(`
// //       CREATE TABLE users (
// //         id NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
// //         username VARCHAR2(255) NOT NULL,
// //         password VARCHAR2(255) NOT NULL
// //       )
// //     `);
// //     console.log('User table created.');
// //     await connection.close();
// //   } catch (err) {
// //     console.error(err);
// //   }
// // }


// // Serve the sign-up form at the root path
// app.get('/', (req, res) => {
//   res.sendFile(__dirname + '/index.html');
// });



























// // Sign-up route
// app.post('/signup', async (req, res) => {
//   console.log("1");
//   const { username, password } = req.body;
//   console.log("2");
//   try {
//     console.log("__");
//     console.log(dbConfig);
//     const connection = await oracledb.getConnection(dbConfig);
//     console.log("3");
//     await connection.execute(
//       'INSERT INTO myuser (username, password) VALUES (:username, :password)',
//       [username, password]
//     );
//     console.log("4");
//     await connection.commit();
//     console.log("5");
//     console.log('User signed up:', username);
//     await connection.close();
//     res.redirect('/login.html'); // Redirect to login page
//   } catch (err) {
//     console.error(err);
//     res.status(500).send('Error signing up');
//   }
// });



// // Login route
// app.post('/login', async (req, res) => {
//   const { username, password } = req.body;
//   try {
//     console.log(dbConfig);
//     const connection = await oracledb.getConnection(dbConfig);
//     const result = await connection.execute(
//       'SELECT * FROM users WHERE username = :username AND password = :password',
//       [username, password]
//     );
//     await connection.close();
//     if (result.rows.length === 1) {
//       res.send('Login successful'); // You can redirect to a dashboard page
//       res.redirect('success.html')
//     } else {
//       res.send('Login failed');
//     }
//   } catch (err) {
//     console.error(err);
//     res.status(500).send('Error logging in');
//   }
// });




// app.listen(port, () => {
//   console.log(`Server is running on http://localhost:${port}`);
// });

// } catch (err) {
//   console.error(err.message);
// } finally {
//   if (dbConfig) {
//     try {
//       await dbConfig.close();
//     } catch (err) {
//       console.error(err.message);
//     }
//   }
// }

// }


// run();






















// const express = require('express');
// const app = express();
// const oracledb = require('oracledb');


// async function run(){
// // Set up Oracle database connection
// connection = await oracledb.getConnection({
//       user: "system",
//       password: "Oracle_1",
//       connectString: "localhost:1521/orcl",
//     });

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.set('view engine', 'ejs'); // You can use a different template engine if you prefer

// // Serve the HTML form to the client
// app.get('/signup', (req, res) => {
//   res.render('signup'); // Create an EJS template for your form
// });

// // Handle form submission
// app.post('/signup', async (req, res) => {
//   try {
//     // Extract user data from the form submission
//     const { username, password } = req.body;

//     // Insert user data into the Oracle database (sample query)
//     const insertQuery = `INSERT INTO users (username, password) VALUES (:username, :password)`;
//     const binds = { username, password };
//     const options = { autoCommit: true };

//     const connection = await oracledb.getConnection();
//     await connection.execute(insertQuery, binds, options);
//     await connection.close();

//     // Send a success response to the client
//     res.status(201).json({ message: 'User registered successfully' });
//   } catch (error) {
//     // Handle errors, e.g., database errors or validation failures
//     console.error(error);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// // Start the server
// const port = 3000;
// app.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });



// }

// run();


















// // Server-side Node.js (app.js)
// const express = require('express');
// const app = express();

// const oracledb = require('oracledb');

// // Set up Oracle database connection
// // ...
// async function run(){
// let connection;
//  try {connection = await oracledb.getConnection({
//     user: "system",
//     password: "Oracle_1",
//     connectString: "localhost:1521/orcl",
//   });




// app.use(express.json());

// app.post('/api/signup', async (req, res) => {
//   try {
//     // Extract user data from the request body
//     const userData = req.body;

//     // Insert user data into the Oracle database
//     // Use Oracle SQL queries and the oracledb library
//     // ...

//     // Send a success response to the client
//     res.status(201).json({ message: 'User registered successfully' });
//   } catch (error) {
//     // Handle errors, e.g., database errors or validation failures
//     console.error(error);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// // Start the server
// const port = 3000;
// app.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });

// } catch (err) {
//   console.error(err.message);
// } finally {
//   if (connection) {
//     try {
//       await connection.close();
//     } catch (err) {
//       console.error(err.message);
//     }
//   }
// }
// }
// run();















// const oracledb = require("oracledb");
// async function run() {
//   let connection;

//   try {
//     connection = await oracledb.getConnection({
//       user: "system",
//       password: "Oracle_1",
//       connectString: "localhost:1521/orcl",
//     });

//     console.log("Successfully connected to Oracle Database!");
  
//      


//   } catch (err) {
//     console.error(err.message);
//   } finally {
//     if (connection) {
//       try {
//         await connection.close();
//       } catch (err) {
//         console.error(err.message);
//       }
//     }
//   }
// }

// run();





