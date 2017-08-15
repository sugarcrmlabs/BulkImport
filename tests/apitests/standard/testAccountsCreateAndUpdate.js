const chakram = require('chakram');
const expect = chakram.expect;
const {Agent, Fixtures} = require('@sugarcrm/thorn');

describe('bulkapi', function() {
    it('should error and not create Accounts without external_key as an admin user', function*() {
        this.timeout(10000);
        
        var random = parseInt(Math.random() * 999999);

        this.names = [
            'Account A - ' + random,
            'Account B - ' + random,
            'Account C - ' + random,
            'Account D - ' + random
        ];

        this.records = [
            {
                name: this.names[0],
            },
            {
                name: this.names[1]
            }
        ];

        let response = yield Agent.as(Agent.ADMIN).post('BulkImport/records/Accounts', { records: this.records });

        expect(response).to.have.status(200);
        expect(response.body.count).to.not.be.empty;
        expect(response.body.count.created).to.be.empty;
        expect(response.body.count.updated).to.be.empty;
        expect(response.body.count.warnings).to.be.empty;
        expect(response.body.count.errors).to.not.be.empty;
        expect(response.body.count.errors).to.be.equal(2);
        expect(response.body.list).to.not.be.empty;
        expect(response.body.list.created).to.be.empty;
        expect(response.body.list.updated).to.be.empty;
        expect(response.body.list.warnings).to.be.empty;
        expect(response.body.list.errors).to.not.be.empty;
    });

    it('should create two Accounts as an admin user', function*() {
        this.timeout(10000);
        
        this.records = [
            {
                name: this.names[0],
                external_key: this.names[0]
            },
            {
                name: this.names[1],
                external_key: this.names[1]
            }
        ];

        let response = yield Agent.as(Agent.ADMIN).post('BulkImport/records/Accounts', { records: this.records });

        expect(response).to.have.status(200);
        expect(response.body.count).to.not.be.empty;
        expect(response.body.count.created).to.not.be.empty;
        expect(response.body.count.created).to.be.equal(2);
        expect(response.body.count.updated).to.be.empty;
        expect(response.body.count.warnings).to.be.empty;
        expect(response.body.count.errors).to.be.empty;
        expect(response.body.list).to.not.be.empty;
        expect(response.body.list.created).to.not.be.empty;
        expect(response.body.list.created[0].external_key).to.be.equal(this.names[0]);
        expect(response.body.list.created[1].external_key).to.be.equal(this.names[1]);
        expect(response.body.list.updated).to.be.empty;
        expect(response.body.list.warnings).to.be.empty;
        expect(response.body.list.errors).to.be.empty;
    });

    it('should update two Accounts and create one Account as an admin user', function*() {
        this.timeout(10000);
        
        this.records = [
            {
                name: this.names[0],
                external_key: this.names[0]
            },
            {
                name: this.names[1],
                external_key: this.names[1]
            },
            {
                name: this.names[2],
                external_key: this.names[2]
            }
        ];

        let response = yield Agent.as(Agent.ADMIN).post('BulkImport/records/Accounts', { records: this.records });

        expect(response).to.have.status(200);
        expect(response.body.count).to.not.be.empty;
        expect(response.body.count.created).to.not.be.empty;
        expect(response.body.count.created).to.be.equal(1);
        expect(response.body.count.updated).to.not.be.empty;
        expect(response.body.count.updated).to.be.equal(2);
        expect(response.body.count.warnings).to.be.empty;
        expect(response.body.count.errors).to.be.empty;
        expect(response.body.list).to.not.be.empty;
        expect(response.body.list.created).to.not.be.empty;
        expect(response.body.list.created[0].external_key).to.be.equal(this.names[2]);
        expect(response.body.list.updated).to.not.be.empty;
        expect(response.body.list.updated[0].external_key).to.be.equal(this.names[0]);
        expect(response.body.list.updated[1].external_key).to.be.equal(this.names[1]);
        expect(response.body.list.warnings).to.be.empty;
        expect(response.body.list.errors).to.be.empty;
    });

    it('should only create (and not update) Accounts when the skipUpdate flag is set as an admin user', function*() {
        this.timeout(10000);
        
        this.records = [
            {
                name: this.names[0],
                external_key: this.names[0]
            },
            {
                name: this.names[3],
                external_key: this.names[3]
            }
        ];

        let response = yield Agent.as(Agent.ADMIN).post('BulkImport/records/Accounts', { records: this.records, skipUpdate: true });

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
        expect(response.body.list.created[0].external_key).to.be.equal(this.names[3]);
        expect(response.body.list.updated).to.be.empty;
        expect(response.body.list.warnings).to.not.be.empty;
        expect(response.body.list.warnings[0].external_key).to.be.equal(this.names[0]);
        expect(response.body.list.warnings[0].sugar_id).to.not.be.empty;
        expect(response.body.list.errors).to.be.empty;
    });

    it('should update as deleted all Accounts when deleted flag is set for every Account as an admin user', function*() {
        this.timeout(10000);
        
        this.records = [
            {
                external_key: this.names[0],
                deleted: true
            },
            {
                external_key: this.names[1],
                deleted: true
            },
            {
                external_key: this.names[2],
                deleted: true
            },
            {
                external_key: this.names[3],
                deleted: true
            }
        ];

        let response = yield Agent.as(Agent.ADMIN).post('BulkImport/records/Accounts', { records: this.records });

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
        expect(response.body.list.updated[0].external_key).to.be.equal(this.names[0]);
        expect(response.body.list.updated[1].external_key).to.be.equal(this.names[1]);
        expect(response.body.list.updated[2].external_key).to.be.equal(this.names[2]);
        expect(response.body.list.updated[3].external_key).to.be.equal(this.names[3]);
        expect(response.body.list.warnings).to.be.empty;
        expect(response.body.list.errors).to.be.empty;
    });
});
