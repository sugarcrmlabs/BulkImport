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

        response = yield Agent.as(Agent.ADMIN).get('me');
        this.adminUserId = response.body.current_user.id;

        this.names = [
            'Account A - ' + this.random,
            'Account B - ' + this.random,
            'Account C - ' + this.random
        ];

        this.ids = [
            'a-' + this.random,
            'b-' + this.random,
            'c-' + this.random
        ]
    });

    after(function*() {
        let response = yield Agent.as(Agent.ADMIN).delete('Users/' + this.userId);

        expect(response).to.have.status(200);
        expect(response).to.be.an('object');
        expect(response).to.not.be.empty;
        expect(response.body.id).to.not.be.empty;
        expect(response.body.id).to.be.equal(this.userId);
    });

    it('should create one Account as an admin user, through the impersonated test user', function*() {
        this.timeout(10000);
        
        this.records = [
            {
                name: this.names[0],
                external_key: this.ids[0]
            }
        ];

        let response = yield Agent.as(Agent.ADMIN).post('BulkImport/records/Accounts', { records: this.records, save_as_user_id: this.userId });

        expect(response).to.have.status(200);
        expect(response.body.count).to.not.be.empty;
        expect(response.body.count.created).to.not.be.empty;
        expect(response.body.count.created).to.be.equal(1);
        expect(response.body.count.updated).to.be.empty;
        expect(response.body.count.warnings).to.be.empty;
        expect(response.body.count.errors).to.be.empty;
        expect(response.body.list).to.not.be.empty;
        expect(response.body.list.created).to.not.be.empty;
        expect(response.body.list.created[0].external_key).to.be.equal(this.ids[0]);
        expect(response.body.list.updated).to.be.empty;
        expect(response.body.list.warnings).to.be.empty;
        expect(response.body.list.errors).to.be.empty;

        // verify created and modified by ids
        let acc1 = yield Agent.as(Agent.ADMIN).get('Accounts/' + response.body.list.created[0].sugar_id);
        expect(acc1).to.have.status(200);
        expect(acc1.body.id).to.not.be.empty;
        expect(acc1.body.id).to.be.equal(response.body.list.created[0].sugar_id);
        expect(acc1.body.modified_user_id).to.be.equal(this.userId);
        expect(acc1.body.created_by).to.be.equal(this.userId);
    });

    it('should create one Account and update one Account as an admin user, even after impersonating a test user', function*() {
        this.timeout(10000);
        
        this.records = [
            {
                name: this.names[0],
                external_key: this.ids[0]
            },
            {
                name: this.names[1],
                external_key: this.ids[1]
            }
        ];

        let response = yield Agent.as(Agent.ADMIN).post('BulkImport/records/Accounts', { records: this.records });

        expect(response).to.have.status(200);
        expect(response.body.count).to.not.be.empty;
        expect(response.body.count.created).to.not.be.empty;
        expect(response.body.count.created).to.be.equal(1);
        expect(response.body.count.updated).to.not.be.empty;
        expect(response.body.count.updated).to.be.equal(1);
        expect(response.body.count.warnings).to.be.empty;
        expect(response.body.count.errors).to.be.empty;
        expect(response.body.list).to.not.be.empty;
        expect(response.body.list.created).to.not.be.empty;
        expect(response.body.list.created[0].external_key).to.be.equal(this.ids[1]);
        expect(response.body.list.updated).to.not.be.empty;
        expect(response.body.list.updated[0].external_key).to.be.equal(this.ids[0]);
        expect(response.body.list.warnings).to.be.empty;
        expect(response.body.list.errors).to.be.empty;

        // verify created and modified by ids
        let acc1 = yield Agent.as(Agent.ADMIN).get('Accounts/' + response.body.list.updated[0].sugar_id);
        expect(acc1).to.have.status(200);
        expect(acc1.body.id).to.not.be.empty;
        expect(acc1.body.id).to.be.equal(response.body.list.updated[0].sugar_id);
        expect(acc1.body.modified_user_id).to.be.equal(this.adminUserId);
        expect(acc1.body.created_by).to.be.equal(this.userId);

        let acc2 = yield Agent.as(Agent.ADMIN).get('Accounts/' + response.body.list.created[0].sugar_id);
        expect(acc2).to.have.status(200);
        expect(acc2.body.id).to.not.be.empty;
        expect(acc2.body.id).to.be.equal(response.body.list.created[0].sugar_id);
        expect(acc2.body.modified_user_id).to.be.equal(this.adminUserId);
        expect(acc2.body.created_by).to.be.equal(this.adminUserId);
    });


    it('should update two Accounts and create one Account as an admin user, through the impersonated test user', function*() {
        this.timeout(10000);
        
        this.records = [
            {
                name: this.names[0],
                external_key: this.ids[0]
            },
            {
                name: this.names[1],
                external_key: this.ids[1]
            },
            {
                name: this.names[2],
                external_key: this.ids[2]
            }
        ];

        let response = yield Agent.as(Agent.ADMIN).post('BulkImport/records/Accounts', { records: this.records, save_as_user_id: this.userId });

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
        expect(response.body.list.created[0].external_key).to.be.equal(this.ids[2]);
        expect(response.body.list.updated).to.not.be.empty;
        expect(response.body.list.updated[0].external_key).to.be.equal(this.ids[0]);
        expect(response.body.list.updated[1].external_key).to.be.equal(this.ids[1]);
        expect(response.body.list.warnings).to.be.empty;
        expect(response.body.list.errors).to.be.empty;

        // verify created and modified by ids
        let acc1 = yield Agent.as(Agent.ADMIN).get('Accounts/' + response.body.list.created[0].sugar_id);
        expect(acc1).to.have.status(200);
        expect(acc1.body.id).to.not.be.empty;
        expect(acc1.body.id).to.be.equal(response.body.list.created[0].sugar_id);
        expect(acc1.body.modified_user_id).to.be.equal(this.userId);
        expect(acc1.body.created_by).to.be.equal(this.userId);

        let acc2 = yield Agent.as(Agent.ADMIN).get('Accounts/' + response.body.list.updated[0].sugar_id);
        expect(acc2).to.have.status(200);
        expect(acc2.body.id).to.not.be.empty;
        expect(acc2.body.id).to.be.equal(response.body.list.updated[0].sugar_id);
        expect(acc2.body.modified_user_id).to.be.equal(this.userId);
        expect(acc2.body.created_by).to.be.equal(this.userId);

        let acc3 = yield Agent.as(Agent.ADMIN).get('Accounts/' + response.body.list.updated[1].sugar_id);
        expect(acc3).to.have.status(200);
        expect(acc3.body.id).to.not.be.empty;
        expect(acc3.body.id).to.be.equal(response.body.list.updated[1].sugar_id);
        expect(acc3.body.modified_user_id).to.be.equal(this.userId);
        expect(acc3.body.created_by).to.be.equal(this.adminUserId);
    });

    it('should update as deleted all Accounts when deleted flag is set for every Account as an admin user', function*() {
        this.timeout(10000);
        
        this.records = [
            {
                external_key: this.ids[0],
                deleted: true
            },
            {
                external_key: this.ids[1],
                deleted: true
            },
            {
                external_key: this.ids[2],
                deleted: true
            }
        ];

        let response = yield Agent.as(Agent.ADMIN).post('BulkImport/records/Accounts', { records: this.records, save_as_user_id: this.userId });

        expect(response).to.have.status(200);
        expect(response.body.count).to.not.be.empty;
        expect(response.body.count.created).to.be.empty;
        expect(response.body.count.updated).to.not.be.empty;
        expect(response.body.count.updated).to.be.equal(3);
        expect(response.body.count.warnings).to.be.empty;
        expect(response.body.count.errors).to.be.empty;
        expect(response.body.list).to.not.be.empty;
        expect(response.body.list.created).to.be.empty;
        expect(response.body.list.updated).to.not.be.empty;
        expect(response.body.list.updated[0].external_key).to.be.equal(this.ids[0]);
        expect(response.body.list.updated[1].external_key).to.be.equal(this.ids[1]);
        expect(response.body.list.updated[2].external_key).to.be.equal(this.ids[2]);
        expect(response.body.list.warnings).to.be.empty;
        expect(response.body.list.errors).to.be.empty;
    });
});
