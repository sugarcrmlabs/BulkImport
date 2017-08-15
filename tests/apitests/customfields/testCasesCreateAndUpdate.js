const chakram = require('chakram');
const expect = chakram.expect;
const {Agent, Fixtures} = require('@sugarcrm/thorn');

describe('bulkapi', function() {

    before(function*() {

        this.random = parseInt(Math.random() * 999999);

        this.casenames = [
            'CaseA' + this.random,
            'CaseB' + this.random,
            'CaseC' + this.random,
            'CaseD' + this.random
        ];

        this.accountnames = [
            'Account A - ' + this.random,
            'Account B - ' + this.random
        ];

        this.contactnames = [
            'Contact A',
            'Contact B'
        ];

        this.contacts = [
            {
                first_name: this.contactnames[0],
                last_name: this.contactnames[0],
                external_key: 'aaaa-' + this.random + '-aaaa-' + this.random
            },
            {
                first_name: this.contactnames[1],
                last_name: this.contactnames[1],
                external_key: 'bbbb-' + this.random + '-bbbb-' + this.random
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

        expect(response).to.have.status(200);
        expect(response.body.count).to.not.be.empty;
        expect(response.body.count.created).to.not.be.empty;
        expect(response.body.count.created).to.be.equal(2);
        expect(response.body.count.updated).to.be.empty;
        expect(response.body.count.warnings).to.be.empty;
        expect(response.body.count.errors).to.be.empty;
        expect(response.body.list).to.not.be.empty;
        expect(response.body.list.created).to.not.be.empty;
        expect(response.body.list.created[0].external_key).to.be.equal(this.accountnames[0]);
        expect(response.body.list.created[1].external_key).to.be.equal(this.accountnames[1]);
        expect(response.body.list.created[0].sugar_id).to.be.not.empty;
        expect(response.body.list.created[1].sugar_id).to.be.not.empty;
        expect(response.body.list.updated).to.be.empty;
        expect(response.body.list.warnings).to.be.empty;
        expect(response.body.list.errors).to.be.empty;

        this.accountId1 = response.body.list.created[0].sugar_id;
        this.accountId2 = response.body.list.created[1].sugar_id;

        response = yield Agent.as(Agent.ADMIN).post('BulkImport/records/Contacts', { records: this.contacts });

        expect(response).to.have.status(200);
        expect(response.body.count).to.not.be.empty;
        expect(response.body.count.created).to.not.be.empty;
        expect(response.body.count.created).to.be.equal(2);
        expect(response.body.count.updated).to.be.empty;
        expect(response.body.count.errors).to.be.empty;
        expect(response.body.count.warnings).to.be.empty;
        expect(response.body.list).to.not.be.empty;
        expect(response.body.list.created).to.not.be.empty;
        expect(response.body.list.created[0].external_key).to.be.equal(this.contacts[0].external_key);
        expect(response.body.list.created[1].external_key).to.be.equal(this.contacts[1].external_key);
        expect(response.body.list.created[0].sugar_id).to.not.be.empty;
        expect(response.body.list.created[1].sugar_id).to.not.be.empty;
        expect(response.body.list.updated).to.be.empty;
        expect(response.body.list.warnings).to.be.empty;
        expect(response.body.list.errors).to.be.empty;

        this.contactId1 = response.body.list.created[0].sugar_id;
        this.contactId2 = response.body.list.created[1].sugar_id;
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

        response = yield Agent.as(Agent.ADMIN).delete('Contacts/' + this.contactId1);

        expect(response).to.have.status(200);
        expect(response).to.be.an('object');
        expect(response).to.not.be.empty;
        expect(response.body.id).to.not.be.empty;
        expect(response.body.id).to.be.equal(this.contactId1);

        response = yield Agent.as(Agent.ADMIN).delete('Contacts/' + this.contactId2);

        expect(response).to.have.status(200);
        expect(response).to.be.an('object');
        expect(response).to.not.be.empty;
        expect(response.body.id).to.not.be.empty;
        expect(response.body.id).to.be.equal(this.contactId2);
    });

    it('should create two Cases as an admin user', function*() {
        this.timeout(10000);
        
        this.records = [
            {
                name: this.casenames[0],
                external_key: this.casenames[0]
            },
            {
                name: this.casenames[1],
                external_key: this.casenames[1]
            }
        ];

        let response = yield Agent.as(Agent.ADMIN).post('BulkImport/records/Cases', { records: this.records });

        expect(response).to.have.status(200);
        expect(response.body.count).to.not.be.empty;
        expect(response.body.count.created).to.not.be.empty;
        expect(response.body.count.created).to.be.equal(2);
        expect(response.body.count.updated).to.be.empty;
        expect(response.body.count.warnings).to.be.empty;
        expect(response.body.count.errors).to.be.empty;
        expect(response.body.list).to.not.be.empty;
        expect(response.body.list.created).to.not.be.empty;
        expect(response.body.list.created[0].external_key).to.be.equal(this.casenames[0]);
        expect(response.body.list.created[1].external_key).to.be.equal(this.casenames[1]);
        expect(response.body.list.updated).to.be.empty;
        expect(response.body.list.warnings).to.be.empty;
        expect(response.body.list.errors).to.be.empty;
    });

    it('should update two Cases and create one Case as an admin user', function*() {
        this.timeout(10000);
        
        this.records = [
            {
                name: this.casenames[0],
                external_key: this.casenames[0]
            },
            {
                name: this.casenames[1],
                external_key: this.casenames[1]
            },
            {
                name: this.casenames[2],
                external_key: this.casenames[2]
            }
        ];

        let response = yield Agent.as(Agent.ADMIN).post('BulkImport/records/Cases', { records: this.records });

        expect(response).to.have.status(200);
        expect(response.body.count).to.not.be.empty;
        expect(response.body.count.created).to.not.be.empty;
        expect(response.body.count.created).to.be.equal(1);
        expect(response.body.count.updated).to.not.be.empty;
        expect(response.body.count.updated).to.be.equal(2);
        expect(response.body.count.errors).to.be.empty;
        expect(response.body.count.warnings).to.be.empty;
        expect(response.body.list).to.not.be.empty;
        expect(response.body.list.created).to.not.be.empty;
        expect(response.body.list.created[0].external_key).to.be.equal(this.casenames[2]);
        expect(response.body.list.updated).to.not.be.empty;
        expect(response.body.list.updated[0].external_key).to.be.equal(this.casenames[0]);
        expect(response.body.list.updated[1].external_key).to.be.equal(this.casenames[1]);
        expect(response.body.list.warnings).to.be.empty;
        expect(response.body.list.errors).to.be.empty;
    });

    it('should only create (and not update) Cases when the skipUpdate flag is set as an admin user', function*() {
        this.timeout(10000);
        
        this.records = [
            {
                name: this.casenames[0],
                external_key: this.casenames[0]
            },
            {
                name: this.casenames[3],
                external_key: this.casenames[3]
            }
        ];

        let response = yield Agent.as(Agent.ADMIN).post('BulkImport/records/Cases', { records: this.records, skipUpdate: true });

        expect(response).to.have.status(200);
        expect(response.body.count).to.not.be.empty;
        expect(response.body.count.created).to.not.be.empty;
        expect(response.body.count.created).to.be.equal(1);
        expect(response.body.count.updated).to.be.empty;
        expect(response.body.count.warnings).to.not.be.empty;
        expect(response.body.count.warnings).to.be.equal(1);
        expect(response.body.count.errors).to.be.empty;
        expect(response.body.list).to.not.be.empty;
        expect(response.body.list.created).to.not.be.empty;
        expect(response.body.list.created[0].external_key).to.be.equal(this.casenames[3]);
        expect(response.body.list.updated).to.be.empty;
        expect(response.body.list.warnings).to.not.be.empty;
        expect(response.body.list.warnings[0].external_key).to.be.equal(this.casenames[0]);
        expect(response.body.list.warnings[0].sugar_id).to.not.be.empty;
        expect(response.body.list.errors).to.be.empty;
    });

    it('should relate two Cases with two Accounts based on the external keys, as an admin user', function*() {
        this.timeout(10000);

        this.relationships = [
            {
                left_external_key: this.casenames[0],
                right_external_key: this.accountnames[0]
            },
            {
                left_external_key: this.casenames[1],
                right_external_key: this.accountnames[1]
            }
        ];

        let response = yield Agent.as(Agent.ADMIN).post('BulkImport/relationships/Cases/accounts', { records: this.relationships });

        expect(response).to.have.status(200);
        expect(response.body.count).to.not.be.empty;
        expect(response.body.count.related).to.not.be.empty;
        expect(response.body.count.related).to.be.equal(2);
        expect(response.body.count.errors).to.be.empty;
        expect(response.body.list).to.not.be.empty;
        expect(response.body.list.related).to.not.be.empty;
        expect(response.body.list.related[0].external_key_left).to.be.equal(this.casenames[0]);
        expect(response.body.list.related[1].external_key_left).to.be.equal(this.casenames[1]);
        expect(response.body.list.related[0].sugar_id_left).to.not.be.empty;
        expect(response.body.list.related[1].sugar_id_left).to.not.be.empty;
        expect(response.body.list.related[0].external_key_right).to.be.equal(this.accountnames[0]);
        expect(response.body.list.related[1].external_key_right).to.be.equal(this.accountnames[1]);
        expect(response.body.list.related[0].sugar_id_right).to.be.equal(this.accountId1);
        expect(response.body.list.related[1].sugar_id_right).to.be.equal(this.accountId2);
        expect(response.body.list.errors).to.be.empty;

        // and swap the relationships
        this.relationships = [
            {
                left_external_key: this.casenames[0],
                right_external_key: this.accountnames[1]
            },
            {
                left_external_key: this.casenames[1],
                right_external_key: this.accountnames[0]
            }
        ];

        response = yield Agent.as(Agent.ADMIN).post('BulkImport/relationships/Cases/accounts', { records: this.relationships });

        expect(response).to.have.status(200);
        expect(response.body.count).to.not.be.empty;
        expect(response.body.count.related).to.not.be.empty;
        expect(response.body.count.related).to.be.equal(2);
        expect(response.body.count.errors).to.be.empty;
        expect(response.body.list).to.not.be.empty;
        expect(response.body.list.related).to.not.be.empty;
        expect(response.body.list.related[0].external_key_left).to.be.equal(this.casenames[0]);
        expect(response.body.list.related[1].external_key_left).to.be.equal(this.casenames[1]);
        expect(response.body.list.related[0].sugar_id_left).to.not.be.empty;
        expect(response.body.list.related[1].sugar_id_left).to.not.be.empty;
        expect(response.body.list.related[0].external_key_right).to.be.equal(this.accountnames[1]);
        expect(response.body.list.related[1].external_key_right).to.be.equal(this.accountnames[0]);
        expect(response.body.list.related[0].sugar_id_right).to.be.equal(this.accountId2);
        expect(response.body.list.related[1].sugar_id_right).to.be.equal(this.accountId1);
        expect(response.body.list.errors).to.be.empty;
    });

    it('should relate one Case with two Contacts based on the external keys, as an admin user', function*() {
        this.timeout(10000);

        this.relationships = [
            {
                left_external_key: this.casenames[0],
                right_external_key: this.contacts[0].external_key
            },
            {
                left_external_key: this.casenames[0],
                right_external_key: this.contacts[1].external_key
            }
        ];

        let response = yield Agent.as(Agent.ADMIN).post('BulkImport/relationships/Cases/contacts', { records: this.relationships });

        expect(response).to.have.status(200);
        expect(response.body.count).to.not.be.empty;
        expect(response.body.count.related).to.not.be.empty;
        expect(response.body.count.related).to.be.equal(2);
        expect(response.body.count.errors).to.be.empty;
        expect(response.body.list).to.not.be.empty;
        expect(response.body.list.related).to.not.be.empty;
        expect(response.body.list.related[0].external_key_left).to.be.equal(this.casenames[0]);
        expect(response.body.list.related[1].external_key_left).to.be.equal(this.casenames[0]);
        expect(response.body.list.related[0].sugar_id_left).to.not.be.empty;
        expect(response.body.list.related[1].sugar_id_left).to.not.be.empty;
        expect(response.body.list.related[0].external_key_right).to.be.equal(this.contacts[0].external_key);
        expect(response.body.list.related[1].external_key_right).to.be.equal(this.contacts[1].external_key);
        expect(response.body.list.related[0].sugar_id_right).to.be.equal(this.contactId1);
        expect(response.body.list.related[1].sugar_id_right).to.be.equal(this.contactId2);
        expect(response.body.list.errors).to.be.empty;
    });

    it('should update as deleted all Cases when deleted flag is set for every Case as an admin user', function*() {
        this.timeout(10000);
        
        this.records = [
            {
                external_key: this.casenames[0],
                deleted: true
            },
            {
                external_key: this.casenames[1],
                deleted: true
            },
            {
                external_key: this.casenames[2],
                deleted: true
            },
            {
                external_key: this.casenames[3],
                deleted: true
            }
        ];

        let response = yield Agent.as(Agent.ADMIN).post('BulkImport/records/Cases', { records: this.records });

        expect(response).to.have.status(200);
        expect(response.body.count).to.not.be.empty;
        expect(response.body.count.created).to.be.empty;
        expect(response.body.count.updated).to.not.be.empty;
        expect(response.body.count.updated).to.be.equal(4);
        expect(response.body.count.warnings).to.be.empty;
        expect(response.body.count.errors).to.be.empty;
        expect(response.body.list).to.not.be.empty;
        expect(response.body.list.created).to.be.empty;
        expect(response.body.list.updated).to.not.be.empty;
        expect(response.body.list.updated[0].external_key).to.be.equal(this.casenames[0]);
        expect(response.body.list.updated[1].external_key).to.be.equal(this.casenames[1]);
        expect(response.body.list.updated[2].external_key).to.be.equal(this.casenames[2]);
        expect(response.body.list.updated[3].external_key).to.be.equal(this.casenames[3]);
        expect(response.body.list.warnings).to.be.empty;
        expect(response.body.list.errors).to.be.empty;
    });
});
