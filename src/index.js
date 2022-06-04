const { request } = require("express");
const express = require("express");
const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(express.json());

const customers = [];

/*
 cpf - String
name - string
id - uuid
statement[]
 */

/* 
middleware é uma funcção que fica entre o request e o response
 usa-se para fazer a validação de um token e um monte de coisa
*/

//Middleware
function verifyIfExistsAccountCPF(req, res, next) {

    const { cpf } = req.headers;

    const customer = customers.find(customer => customer.cpf === cpf);

    if (!customer) {
        return res.status(400).json({ error: "Customer not found" })
    }

    req.customer = customer; //passar dados para as rotas que consumir este middleware

   return next();
}

function getBalance(statement){
    const balance = statement.reduce((acc, operation)=>{
        if(operation.type === "credit") {
            return acc + operation.amount;
        } else {
            return acc - operation.amount;
        }
    }, 0)

    return balance;
}

app.post("/account", (req, res) => {
    const { cpf, name } = req.body;

    const customerAlreadyExists = customers.some((customer) => customer.cpf === cpf)
    if (customerAlreadyExists) {
        return res.status(400).json({ error: "Customer already Exists!" })
    }
    customers.push({
        cpf,
        name,
        id: uuidv4(),
        statement: []
    })

    return res.status(201).send();
})

//app.use(verifyIfExistsAccountCPF);

app.get("/statement/", verifyIfExistsAccountCPF, (req, res) => {
    const { customer } = req

    return res.json(customer.statement)
})

app.post("/deposit", verifyIfExistsAccountCPF, (req, res) => {
    const { description, amount } = req.body;

    const { customer } = req;

    const statementOperation = {
        description,
        amount,
        create_at: new Date(),
        type: "credit"
    }

    customer.statement.push(statementOperation);

    return res.status(201).send();
})

app.post("/withdraw", verifyIfExistsAccountCPF, (req, res) => {
    const { amount } = req.body;

    const { customer } = req;

    const balance = getBalance(customer.statement);


    if(balance < amount) {

        return res.status(400).json({error: "Insufficient funds!"})
    }

    const statementOperation = {
        amount,
        create_at: new Date(),
        type: "debit"

    }
    
    customer.statement.push(statementOperation);

    return res.status(201).send();
})

app.get("/statement/date", verifyIfExistsAccountCPF, (req, res) => {
    const { customer } = req;

    const { date } = req.query;

    const dateFormat = new Date(date + " 00:00");

    const  statement = customer.statement.filter((statement) => statement.create_at.toDateString() === new Date(dateFormat).toDateString())

    return res.json(statement)
})

app.put("/account", verifyIfExistsAccountCPF, (req, res) => {
    const { name } = req.body;
    const { customer } = req;

    customer.name = name;

    return res.status(201).send();
})

app.get("/account", verifyIfExistsAccountCPF, (req, res) => {
    const { customer } = req;


    return res.status(201).json(customer);
})

app.delete("/account", verifyIfExistsAccountCPF, (req, res) => {
    const { customer } = req;

    customers.splice(customer, 1)


    return res.status(201).json(customers);
})

app.get("/balance", verifyIfExistsAccountCPF, (req, res) => {
    const { customer } = req;

    const balance = getBalance(customers.statement)


    return res.json(balance);
})




app.listen(3000);