import pool from "../config/db.js";
import { v4 as uuid } from "uuid";

export default async function identifyCustomer(req, res) {
    const { email, phoneNumber } = req.body;

    try {
        if (!email && !phoneNumber) return res.status(404).json({ error: "Add data to identify" });

        const data = await pool.query('select * from "Contact" where "email"=($1) or "phoneNumber"=($2)', [email, phoneNumber]);

        if (data.rowCount == 0) {
            const id = uuid();

            const addContact = await pool.query('insert into "Contact" ("id","phoneNumber","email","linkedId","linkPrecedence","createdAt","updatedAt","deletedAt") values ($1,$2,$3,$4,$5,$6,$7,$8)', [id, phoneNumber, email, null, 'primary', new Date().toISOString(), new Date().toISOString(), null]);

            const response = {
                contact: {
                    primaryContatctId: id,
                    emails: [email], // first element being email of primary contact 
                    phoneNumbers: [phoneNumber], // first element being phoneNumber of primary contact
                    secondaryContactIds: [] // Array of all Contact IDs that are "secondary" to the primary contact
                }
            }
            console.log(response);

            return res.status(200).json(response);
        }

        const ids = new Set();
        let alreadyExists = 0;

        data.rows.forEach((row) => {
            if (row.linkPrecedence == 'primary') ids.add(row.id);
            else ids.add(row.linkedId);
            if (row.email == email && row.phoneNumber == phoneNumber) alreadyExists = 1;
        })


        const idsArr = [...ids];

        const result = await pool.query(`SELECT * FROM "Contact" WHERE "id"=ANY($1::text[]) OR "linkedId"=ANY($1::text[])`, [idsArr]);

        const primaryContacts = result.rows.filter((row) => row.linkPrecedence == 'primary');
        const secondaryContacts = result.rows.filter((row) => row.linkPrecedence == 'secondary');

        const response = {
            contact: {
                primaryContatctId: null,
                emails: [], // first element being email of primary contact 
                phoneNumbers: [], // first element being phoneNumber of primary contact
                secondaryContactIds: [] // Array of all Contact IDs that are "secondary" to the primary contact
            }
        }

        if (primaryContacts.length == 1) {
            //only 1 primary contact so update required
            if (alreadyExists == 0) {
                const id = uuid();
                const addPrimaryContact = await pool.query('insert into "Contact" ("id","phoneNumber","email","linkedId","linkPrecedence","createdAt","updatedAt","deletedAt") values ($1,$2,$3,$4,$5,$6,$7,$8)', [id.toString(), phoneNumber.toString(), email.toString(), primaryContacts[0].id.toString(), 'secondary', new Date().toISOString(), new Date().toISOString(), null]);
            }

            response.contact.primaryContatctId = primaryContacts[0].id;

            let secondaryemails = secondaryContacts.map((row) => row.email);
            secondaryemails = [...secondaryemails, primaryContacts[0].email, email]
            response.contact.emails = [...new Set(secondaryemails)];
            console.log(response.contact.emails, 'emails');

            console.log(phoneNumber.toString());


            let secondaryphone = secondaryContacts.map((row) => row.phoneNumber);
            secondaryphone = [...secondaryphone, primaryContacts[0].phoneNumber]
            response.contact.phoneNumbers = [...new Set(secondaryphone)];
            console.log(response.contact.phoneNumbers, 'phone');

            let secondaryids = secondaryContacts.map((row) => row.id);
            secondaryids = [...secondaryids, id];
            response.contact.secondaryContactIds = [...new Set(secondaryids)];

            return res.status(200).json(response);
        }
        else {
            console.log(primaryContacts,'primarys');
            
            const sameEmailContact=primaryContacts.filter((row)=>row.email==email)
            const samePhoneContact=primaryContacts.filter((row)=>row.phoneNumber==phoneNumber)
            console.log('email',sameEmailContact);
            console.log('phone',samePhoneContact);
            
        }


    } catch (error) {
        console.log(error);

    }
}