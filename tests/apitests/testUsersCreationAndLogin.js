const chakram = require('chakram');
const expect = chakram.expect;
const {Agent, Fixtures} = require('@sugarcrm/thorn');

describe('bulkapi', function() {
    it('should be able to login to the application with a newly bulk imported regular user', function*() {
        this.timeout(15000);

        this.url = process.env.THORN_SERVER_URL + '/rest/v10/';

        var random = parseInt(Math.random() * 999999);

        this.userDetails = {
            first_name: 'John',
            last_name: 'Smith',
            user_name: 'jsmith' + random,
            external_key: 'jsmith' + random,
            password: 'jsmith',
            is_admin: 0,
            status: 'Active'
        }

        let response = yield Agent.as(Agent.ADMIN).post('BulkImport/records/Users', { records: [ this.userDetails ] });

        expect(response).to.have.status(200);
        expect(response.body).to.not.be.empty;
        expect(response.body.count).to.not.be.empty;
        expect(response.body.count.errors).to.be.empty;
        expect(response.body.count.updated).to.be.empty;
        expect(response.body.count.created).to.not.be.empty;
        expect(response.body.count.created).to.be.equal(1);
        expect(response.body.list).to.not.be.empty;
        expect(response.body.list.created).to.not.be.empty;
        expect(response.body.list.errors).to.be.empty;

        this.userId = response.body.list.created[0].sugar_id;

        response = yield chakram.post(this.url + 'oauth2/token',
            {
                'grant_type': 'password',
                'username': this.userDetails.user_name,
                'password': this.userDetails.password,
                'client_id': 'sugar',
                'platform': 'base',
                'client_secret': ''
            },
            {
                headers: {
                    'X-Thorn': 'ManualLogin ' + this.userDetails.user_name
                }
            }
        );

        expect(response).to.have.status(200);
        expect(response.body).to.not.be.empty;
        expect(response.body).to.be.an('object');
        expect(response.body.access_token).to.not.be.empty;
        expect(response.body.access_token).to.have.lengthOf(36);

        response = yield chakram.get(this.url + 'me',
            {
                headers: {
                    'X-Thorn': 'TestActionAsUser',
                    'OAuth-Token': response.body.access_token
                }
            }
        );

        expect(response).to.have.status(200);
        expect(response.body).to.not.be.empty;
        expect(response.body).to.be.an('object');
        expect(response.body.current_user).to.not.be.empty;
        expect(response.body.current_user).to.be.an('object');
        expect(response.body.current_user.id).to.not.be.empty;
        expect(response.body.current_user.id).to.be.equal(this.userId);

        response = yield Agent.as(Agent.ADMIN).delete('Users/' + this.userId);

        expect(response).to.have.status(200);
        expect(response).to.be.an('object');
        expect(response).to.not.be.empty;
        expect(response.body.id).to.not.be.empty;
        expect(response.body.id).to.be.equal(this.userId);
    });
});
