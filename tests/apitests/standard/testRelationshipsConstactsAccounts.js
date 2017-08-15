const chakram = require('chakram');
const expect = chakram.expect;
const {Agent, Fixtures} = require('@sugarcrm/thorn');

describe('bulkapi', function() {
    before(function*() {

        this.random = parseInt(Math.random() * 999999);

        this.accountnames = [
            'Account A - ' + this.random,
            'Account B - ' + this.random
        ];

        this.contactdetails = [
            {
                name: 'Contact A',
                id: 'aaaa-' + this.random + '-aaaa-' + this.random
            },
            {
                name: 'Contact B',
                id: 'bbbb-' + this.random + '-bbbb-' + this.random
            },
            {
                name: 'Contact C',
                id: 'cccc-' + this.random + '-cccc-' + this.random
            }
        ];

        this.accounts = [
            {
                external_key: this.accountnames[0],
                name: this.accountnames[0]
            },
            {
                external_key: this.accountnames[1],
                name: this.accountnames[1]
            }
        ];

        let response = yield Agent.as(Agent.ADMIN).post('BulkImport/records/Accounts', { records: this.accounts });

        this.accountId1 = response.body.list.created[0].sugar_id;
        this.accountId2 = response.body.list.created[1].sugar_id;
    });

    after(function*() {
        let response = yield Agent.as(Agent.ADMIN).delete('Accounts/' + this.accountId1);

        expect(response).to.have.status(200);
        expect(response).to.be.an('object');
        expect(response).to.not.be.empty;
        expect(response.body.id).to.not.be.empty;
        expect(response.body.id).to.be.equal(this.accountId1);

        response = yield Agent.as(Agent.ADMIN).delete('Accounts/' + this.accountId2);

        expect(response).to.have.status(200);
        expect(response).to.be.an('object');
        expect(response).to.not.be.empty;
        expect(response.body.id).to.not.be.empty;
        expect(response.body.id).to.be.equal(this.accountId2);

        response = yield Agent.as(Agent.ADMIN).delete('Contacts/' + this.contactdetails[0].id);

        expect(response).to.have.status(200);
        expect(response).to.be.an('object');
        expect(response).to.not.be.empty;
        expect(response.body.id).to.not.be.empty;
        expect(response.body.id).to.be.equal(this.contactdetails[0].id);

        response = yield Agent.as(Agent.ADMIN).delete('Contacts/' + this.contactdetails[1].id);

        expect(response).to.have.status(200);
        expect(response).to.be.an('object');
        expect(response).to.not.be.empty;
        expect(response.body.id).to.not.be.empty;
        expect(response.body.id).to.be.equal(this.contactdetails[1].id);

        response = yield Agent.as(Agent.ADMIN).delete('Contacts/' + this.contactdetails[2].id);

        expect(response).to.have.status(200);
        expect(response).to.be.an('object');
        expect(response).to.not.be.empty;
        expect(response.body.id).to.not.be.empty;
        expect(response.body.id).to.be.equal(this.contactdetails[2].id);
    });

    it('should create three Contacts with Sugar ids as external keys as an admin user', function*() {
        this.timeout(10000);
        
        this.contacts = [
            {
                external_key: this.contactdetails[0].id,
                first_name: this.contactdetails[0].name,
                last_name: this.contactdetails[0].name
            },
            {
                external_key: this.contactdetails[1].id,
                first_name: this.contactdetails[1].name,
                last_name: this.contactdetails[1].name
            },
            {
                external_key: this.contactdetails[2].id,
                first_name: this.contactdetails[2].name,
                last_name: this.contactdetails[2].name
            }
        ];

        let response = yield Agent.as(Agent.ADMIN).post('BulkImport/records/Contacts', { records: this.contacts });

        expect(response).to.have.status(200);
        expect(response.body.count).to.not.be.empty;
        expect(response.body.count.created).to.not.be.empty;
        expect(response.body.count.created).to.be.equal(3);
        expect(response.body.count.updated).to.be.empty;
        expect(response.body.count.errors).to.be.empty;
        expect(response.body.list).to.not.be.empty;
        expect(response.body.list.created).to.not.be.empty;
        expect(response.body.list.created[0].external_key).to.be.equal(this.contactdetails[0].id);
        expect(response.body.list.created[1].external_key).to.be.equal(this.contactdetails[1].id);
        expect(response.body.list.created[2].external_key).to.be.equal(this.contactdetails[2].id);
        expect(response.body.list.created[0].sugar_id).to.be.equal(this.contactdetails[0].id);
        expect(response.body.list.created[1].sugar_id).to.be.equal(this.contactdetails[1].id);
        expect(response.body.list.created[2].sugar_id).to.be.equal(this.contactdetails[2].id);
        expect(response.body.list.updated).to.be.empty;
        expect(response.body.list.errors).to.be.empty;
    });

    it('should relate two Contacts with two Accounts based on the external keys, as an admin user', function*() {
        this.timeout(10000);

        this.relationships = [
            {
                left_external_key: this.contactdetails[0].id,
                right_external_key: this.accountnames[0]
            },
            {
                left_external_key: this.contactdetails[1].id,
                right_external_key: this.accountnames[1]
            }
        ];

        let response = yield Agent.as(Agent.ADMIN).post('BulkImport/relationships/Contacts/accounts', { records: this.relationships });

        expect(response).to.have.status(200);
        expect(response.body.count).to.not.be.empty;
        expect(response.body.count.related).to.not.be.empty;
        expect(response.body.count.related).to.be.equal(2);
        expect(response.body.count.errors).to.be.empty;
        expect(response.body.list).to.not.be.empty;
        expect(response.body.list.related).to.not.be.empty;
        expect(response.body.list.related[0].external_key_left).to.be.equal(this.contactdetails[0].id);
        expect(response.body.list.related[1].external_key_left).to.be.equal(this.contactdetails[1].id);
        expect(response.body.list.related[0].sugar_id_left).to.be.equal(this.contactdetails[0].id);
        expect(response.body.list.related[1].sugar_id_left).to.be.equal(this.contactdetails[1].id);
        expect(response.body.list.related[0].external_key_right).to.be.equal(this.accountnames[0]);
        expect(response.body.list.related[1].external_key_right).to.be.equal(this.accountnames[1]);
        expect(response.body.list.related[0].sugar_id_right).to.be.equal(this.accountId1);
        expect(response.body.list.related[1].sugar_id_right).to.be.equal(this.accountId2);
        expect(response.body.list.errors).to.be.empty;
    });

    it('should not relate a Contact with an incorrect Account based on the external keys, as an admin user', function*() {
        this.timeout(10000);

        var non_existent_account_key = 'Account C';        

        this.relationships = [
            {
                left_external_key: this.contactdetails[2].id,
                right_external_key: non_existent_account_key
            }
        ];

        let response = yield Agent.as(Agent.ADMIN).post('BulkImport/relationships/Contacts/accounts', { records: this.relationships });

        expect(response).to.have.status(200);
        expect(response.body.count).to.not.be.empty;
        expect(response.body.count.related).to.be.empty;
        expect(response.body.count.errors).to.not.be.empty;
        expect(response.body.count.errors).to.be.equal(1);
        expect(response.body.list).to.not.be.empty;
        expect(response.body.list.related).to.be.empty;
        expect(response.body.list.errors).to.not.be.empty;
        expect(response.body.list.errors[0].external_key_left).to.be.equal(this.contactdetails[2].id);
        expect(response.body.list.errors[0].sugar_id_left).to.be.equal(this.contactdetails[2].id);
        expect(response.body.list.errors[0].external_key_right).to.be.equal(non_existent_account_key);
        expect(response.body.list.errors[0].sugar_id_right).to.be.equal('');
    });

    it('should not relate an incorrect Contact with an Account based on the external keys, as an admin user', function*() {
        this.timeout(10000);

        var non_existent_contact_key = 'ddd-ddd-ddd-ddd';        

        this.relationships = [
            {
                left_external_key: non_existent_contact_key,
                right_external_key: this.accountnames[0]
            }
        ];

        let response = yield Agent.as(Agent.ADMIN).post('BulkImport/relationships/Contacts/accounts', { records: this.relationships });

        expect(response).to.have.status(200);
        expect(response.body.count).to.not.be.empty;
        expect(response.body.count.related).to.be.empty;
        expect(response.body.count.errors).to.not.be.empty;
        expect(response.body.count.errors).to.be.equal(1);
        expect(response.body.list).to.not.be.empty;
        expect(response.body.list.related).to.be.empty;
        expect(response.body.list.errors).to.not.be.empty;
        expect(response.body.list.errors[0].external_key_left).to.be.equal(non_existent_contact_key);
        expect(response.body.list.errors[0].sugar_id_left).to.be.equal('');
        expect(response.body.list.errors[0].external_key_right).to.be.equal(this.accountnames[0]);
        expect(response.body.list.errors[0].sugar_id_right).to.be.equal(this.accountId1);
    });

    it('should return a mixed error and success relationship response, when not all related records exist based on the external keys, as an admin user', function*() {
        this.timeout(10000);

        // first side
        var non_existent_contact_key = 'ddd-ddd-ddd-ddd';        

        this.relationships = [
            {
                left_external_key: non_existent_contact_key,
                right_external_key: this.accountnames[0]
            },
            {
                left_external_key: this.contactdetails[1].id,
                right_external_key: this.accountnames[1]
            }
        ];

        let response = yield Agent.as(Agent.ADMIN).post('BulkImport/relationships/Contacts/accounts', { records: this.relationships });

        expect(response).to.have.status(200);
        expect(response.body.count).to.not.be.empty;
        expect(response.body.count.related).to.not.be.empty;
        expect(response.body.count.related).to.be.equal(1);
        expect(response.body.count.errors).to.not.be.empty;
        expect(response.body.count.errors).to.be.equal(1);
        expect(response.body.list).to.not.be.empty;
        expect(response.body.list.related).to.not.be.empty;
        expect(response.body.list.related[0].external_key_left).to.be.equal(this.contactdetails[1].id);
        expect(response.body.list.related[0].sugar_id_left).to.be.equal(this.contactdetails[1].id);
        expect(response.body.list.related[0].external_key_right).to.be.equal(this.accountnames[1]);
        expect(response.body.list.related[0].sugar_id_right).to.be.equal(this.accountId2);
        expect(response.body.list.errors).to.not.be.empty;
        expect(response.body.list.errors[0].external_key_left).to.be.equal(non_existent_contact_key);
        expect(response.body.list.errors[0].sugar_id_left).to.be.equal('');
        expect(response.body.list.errors[0].external_key_right).to.be.equal(this.accountnames[0]);
        expect(response.body.list.errors[0].sugar_id_right).to.be.equal(this.accountId1);

        // second side
        var non_existent_account_key = 'ddd-ddd-ddd-ddd';        

        this.relationships = [
            {
                left_external_key: this.contactdetails[0].id,
                right_external_key: non_existent_account_key
            },
            {
                left_external_key: this.contactdetails[1].id,
                right_external_key: this.accountnames[1]
            }
        ];

        response = yield Agent.as(Agent.ADMIN).post('BulkImport/relationships/Contacts/accounts', { records: this.relationships });

        expect(response).to.have.status(200);
        expect(response.body.count).to.not.be.empty;
        expect(response.body.count.related).to.not.be.empty;
        expect(response.body.count.related).to.be.equal(1);
        expect(response.body.count.errors).to.not.be.empty;
        expect(response.body.count.errors).to.be.equal(1);
        expect(response.body.list).to.not.be.empty;
        expect(response.body.list.related).to.not.be.empty;
        expect(response.body.list.related[0].external_key_left).to.be.equal(this.contactdetails[1].id);
        expect(response.body.list.related[0].sugar_id_left).to.be.equal(this.contactdetails[1].id);
        expect(response.body.list.related[0].external_key_right).to.be.equal(this.accountnames[1]);
        expect(response.body.list.related[0].sugar_id_right).to.be.equal(this.accountId2);
        expect(response.body.list.errors).to.not.be.empty;
        expect(response.body.list.errors[0].external_key_left).to.be.equal(this.contactdetails[0].id);
        expect(response.body.list.errors[0].sugar_id_left).to.be.equal(this.contactdetails[0].id);
        expect(response.body.list.errors[0].external_key_right).to.be.equal(non_existent_account_key);
        expect(response.body.list.errors[0].sugar_id_right).to.be.equal('');
    });
});
