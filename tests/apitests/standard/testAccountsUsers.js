const chakram = require('chakram');
const expect = chakram.expect;
const {Agent, Fixtures} = require('@sugarcrm/thorn');

describe('bulkapi', function() {
    before(function*() {

        this.random = parseInt(Math.random() * 999999);

        this.userName = 'jsmith' + this.random;

        this.userDetails = {
            first_name: 'John',
            last_name: 'Smith',
            user_name: this.userName,
            external_key: this.userName,
            password: 'jsmith',
            is_admin: 0,
            status: 'Active'
        }

        let response = yield Agent.as(Agent.ADMIN).post('BulkImport/records/Users', { records: [ this.userDetails ] });
        this.userId = response.body.list.created[0].sugar_id;

        this.accountName = 'Account A - ' + this.random;
        this.accountId = 'a-' + this.random
    });

    after(function*() {
        let response = yield Agent.as(Agent.ADMIN).delete('Users/' + this.userId);

        expect(response).to.have.status(200);
        expect(response).to.be.an('object');
        expect(response).to.not.be.empty;
        expect(response.body.id).to.not.be.empty;
        expect(response.body.id).to.be.equal(this.userId);
    });

    it('should relate the correct User to an Account based on the external key, as an admin user', function*() {
        this.timeout(10000);

        this.records = [
            {
                name: this.accountName,
                external_key: this.accountId,
                external_assigned_user_key: this.userName
            }
        ];       

        let response = yield Agent.as(Agent.ADMIN).post('BulkImport/records/Accounts', { records: this.records });

        expect(response).to.have.status(200);
        expect(response.body.count).to.not.be.empty;
        expect(response.body.count.created).to.be.equal(1);
        expect(response.body.count.updated).to.be.empty;
        expect(response.body.count.errors).to.be.empty;
        expect(response.body.list).to.not.be.empty;
        expect(response.body.list.created).to.not.be.empty;
        expect(response.body.list.created[0].external_key).to.be.equal(this.accountId);
        expect(response.body.list.created[0].sugar_id).to.not.be.empty;
        expect(response.body.list.updated).to.be.empty;

        var account_id = response.body.list.created[0].sugar_id;

        response = yield Agent.as(Agent.ADMIN).get('Accounts/' + account_id);

        expect(response).to.have.status(200);
        expect(response.body).to.not.be.empty;
        expect(response.body.id).to.not.be.empty;
        expect(response.body.id).to.be.equal(account_id);
        expect(response.body.assigned_user_id).to.not.be.empty;
        expect(response.body.assigned_user_id).to.be.equal(this.userId);

        response = yield Agent.as(Agent.ADMIN).delete('Accounts/' + account_id);

        expect(response).to.have.status(200);
        expect(response).to.be.an('object');
        expect(response).to.not.be.empty;
        expect(response.body.id).to.not.be.empty;
        expect(response.body.id).to.be.equal(account_id);
    });
});
