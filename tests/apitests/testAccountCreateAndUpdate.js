const chakram = require('chakram');
const expect = chakram.expect;
const {Agent, Fixtures} = require('@sugarcrm/thorn');

describe('bulkapi', function() {
    it('should error and not create Accounts without external_key as an admin user', function*() {
        this.timeout(10000);
        
        this.records = [
            {
                name: 'Account 1',
            },
            {
                name: 'Account 2',
            },
        ];

        let response = yield Agent.as(Agent.ADMIN).post('BulkImport/records/Accounts', { records: this.records });

        expect(response).to.have.status(200);
        expect(response.body.count).to.not.be.empty;
        expect(response.body.count.errors).to.not.be.empty;
        expect(response.body.count.errors).to.be.equal(2);
        expect(response.body.list).to.not.be.empty;
        expect(response.body.list.errors).to.not.be.empty;
    });

    it('should create two Accounts as an admin user', function*() {
        this.timeout(10000);
        
        this.records = [
            {
                name: 'Account 1',
                external_key: 'Account 1',
            },
            {
                name: 'Account 2',
                external_key: 'Account 2',
            },
        ];

        let response = yield Agent.as(Agent.ADMIN).post('BulkImport/records/Accounts', { records: this.records });

        expect(response).to.have.status(200);
        expect(response.body.count).to.not.be.empty;
        expect(response.body.count.created).to.not.be.empty;
        expect(response.body.count.created).to.be.equal(2);
        expect(response.body.count.updated).to.be.empty;
        expect(response.body.list).to.not.be.empty;
        expect(response.body.list.created).to.not.be.empty;
        expect(response.body.list.created['0'].external_key).to.be.equal('Account 1');
        expect(response.body.list.created['1'].external_key).to.be.equal('Account 2');
    });

    it('should update two Accounts and create one Account as an admin user', function*() {
        this.timeout(10000);
        
        this.records = [
            {
                name: 'Account 1',
                external_key: 'Account 1',
            },
            {
                name: 'Account 2',
                external_key: 'Account 2',
            },
            {
                name: 'Account 3',
                external_key: 'Account 3',
            },
        ];

        let response = yield Agent.as(Agent.ADMIN).post('BulkImport/records/Accounts', { records: this.records });

        expect(response).to.have.status(200);
        expect(response.body.count).to.not.be.empty;
        expect(response.body.count.created).to.not.be.empty;
        expect(response.body.count.created).to.be.equal(1);
        expect(response.body.count.updated).to.not.be.empty;
        expect(response.body.count.updated).to.be.equal(2);
        expect(response.body.list).to.not.be.empty;
        expect(response.body.list.created).to.not.be.empty;
        expect(response.body.list.created['0'].external_key).to.be.equal('Account 3');
        expect(response.body.list.updated).to.not.be.empty;
        expect(response.body.list.updated['0'].external_key).to.be.equal('Account 1');
        expect(response.body.list.updated['1'].external_key).to.be.equal('Account 2');
    });
});
